/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { estypes } from '@elastic/elasticsearch';
import {
  SPACE_IDS,
  EVENT_ACTION,
  EVENT_KIND,
  EVENT_SEQUENCE,
  MESSAGE,
  RULE_ID,
  TIMESTAMP,
} from '@kbn/rule-data-utils';
import { once } from 'lodash/fp';
import moment from 'moment';
import { RuleDataClient, RuleDataPluginService } from '../../../../../rule_registry/server';
import { SERVER_APP_ID } from '../../../../common/constants';
import { RuleExecutionStatus } from '../../../../common/detection_engine/schemas/common/schemas';
import { invariant } from '../../../../common/utils/invariant';
import { IRuleStatusSOAttributes } from '../rules/types';
import { makeFloatString } from '../signals/utils';
import { EVENTS_INDEX_PREFIX, RULE_STATUS, RULE_STATUS_SEVERITY } from './constants';
import { parseRuleExecutionLog, RuleExecutionEvent } from './parse_rule_execution_log';
import { bootstrapRuleExecutionLog } from './rule_execution_log_bootstrapper';
import { ExecutionMetric, ExecutionMetricValue } from './types';
import {
  getLastEntryAggregation,
  getMetricAggregation,
  getMetricField,
  sortByTimeDesc,
} from './utils';

const statusSeverityDict: Record<RuleExecutionStatus, number> = {
  [RuleExecutionStatus.succeeded]: 0,
  [RuleExecutionStatus['going to run']]: 10,
  [RuleExecutionStatus.warning]: 20,
  [RuleExecutionStatus['partial failure']]: 20,
  [RuleExecutionStatus.failed]: 30,
};

interface FindBulkArgs {
  ruleIds: string[];
  spaceId: string;
  logsCount?: number;
  statuses?: RuleExecutionStatus[];
}

interface StatusChangeArgs {
  ruleId: string;
  spaceId: string;
  newStatus: RuleExecutionStatus;
  namespace?: string;
  message?: string;
}

interface ExecutionMetricArgs<T extends ExecutionMetric> {
  ruleId: string;
  spaceId: string;
  namespace?: string;
  metric: T;
  value: ExecutionMetricValue<T>;
}

export interface IRuleExecutionLogClient {
  find: (
    ruleId: string,
    spaceId: string,
    logsCount?: number
  ) => Promise<IRuleStatusSOAttributes[] | undefined>;
  findBulk: (filter: FindBulkArgs) => Promise<FindBulkResponse>;
  create: (event: RuleExecutionEvent, namespace?: string) => Promise<void>;
  logStatusChange: (args: StatusChangeArgs) => Promise<void>;
  logExecutionMetric: <T extends ExecutionMetric>(args: ExecutionMetricArgs<T>) => Promise<void>;
}

interface FindBulkResponse {
  [ruleId: string]: IRuleStatusSOAttributes[] | undefined;
}

export class RuleExecutionLogClient implements IRuleExecutionLogClient {
  #sequence = 0;
  #isWriteEnabled: boolean;
  #ruleDataClient: RuleDataClient;

  constructor(ruleDataService: RuleDataPluginService, isWriteEnabled: boolean) {
    this.#isWriteEnabled = isWriteEnabled;
    this.#ruleDataClient = ruleDataService.getRuleDataClient(
      SERVER_APP_ID,
      EVENTS_INDEX_PREFIX,
      () => this.#initialize(ruleDataService, EVENTS_INDEX_PREFIX)
    );
  }

  #initialize = once(async (ruleDataService: RuleDataPluginService, indexAlias: string) => {
    await bootstrapRuleExecutionLog(ruleDataService, indexAlias);
  });

  public async find(ruleId: string, spaceId: string, logsCount = 1) {
    const results = await this.findBulk({ ruleIds: [ruleId], logsCount, spaceId });

    return results[ruleId];
  }

  public async findBulk({ ruleIds, spaceId, statuses, logsCount = 1 }: FindBulkArgs) {
    if (ruleIds.length === 0) {
      return {};
    }

    const filter: estypes.QueryDslQueryContainer[] = [
      { terms: { [RULE_ID]: ruleIds } },
      { terms: { [SPACE_IDS]: [spaceId] } },
    ];

    if (statuses) {
      filter.push({ terms: { [RULE_STATUS]: statuses } });
    }

    const result = await this.#ruleDataClient.getReader().search({
      size: 0,
      body: {
        query: {
          bool: {
            filter,
          },
        },
        aggs: {
          rules: {
            terms: {
              field: RULE_ID,
              size: ruleIds.length,
            },
            aggs: {
              most_recent_logs: {
                top_hits: {
                  sort: sortByTimeDesc,
                  size: logsCount,
                },
              },
              last_failure: getLastEntryAggregation(RuleExecutionStatus.failed),
              last_success: getLastEntryAggregation(RuleExecutionStatus.succeeded),
              execution_gap: getMetricAggregation(ExecutionMetric.executionGap),
              search_duration_max: getMetricAggregation(ExecutionMetric.searchDurationMax),
              indexing_duration_max: getMetricAggregation(ExecutionMetric.indexingDurationMax),
              indexing_lookback: getMetricAggregation(ExecutionMetric.indexingLookback),
            },
          },
        },
      },
    });

    if (result.hits.total.value === 0) {
      return {};
    }

    invariant(result.aggregations, 'Search response should contain aggregations');

    return Object.fromEntries(
      result.aggregations.rules.buckets.map((bucket) => [
        bucket.key,
        bucket.most_recent_logs.hits.hits.map<IRuleStatusSOAttributes>((event) => {
          const logEntry = parseRuleExecutionLog(event._source);
          invariant(logEntry['rule.id'], 'Malformed execution log entry: rule.id field not found');

          const lastFailure = bucket.last_failure.event.hits.hits[0]
            ? parseRuleExecutionLog(bucket.last_failure.event.hits.hits[0]._source)
            : undefined;

          const lastSuccess = bucket.last_success.event.hits.hits[0]
            ? parseRuleExecutionLog(bucket.last_success.event.hits.hits[0]._source)
            : undefined;

          const lookBack = bucket.indexing_lookback.event.hits.hits[0]
            ? parseRuleExecutionLog(bucket.indexing_lookback.event.hits.hits[0]._source)
            : undefined;

          const executionGap = bucket.execution_gap.event.hits.hits[0]
            ? parseRuleExecutionLog(bucket.execution_gap.event.hits.hits[0]._source)[
                getMetricField(ExecutionMetric.executionGap)
              ]
            : undefined;

          const searchDuration = bucket.search_duration_max.event.hits.hits[0]
            ? parseRuleExecutionLog(bucket.search_duration_max.event.hits.hits[0]._source)[
                getMetricField(ExecutionMetric.searchDurationMax)
              ]
            : undefined;

          const indexingDuration = bucket.indexing_duration_max.event.hits.hits[0]
            ? parseRuleExecutionLog(bucket.indexing_duration_max.event.hits.hits[0]._source)[
                getMetricField(ExecutionMetric.indexingDurationMax)
              ]
            : undefined;

          const alertId = logEntry['rule.id'];
          const statusDate = logEntry[TIMESTAMP];
          const lastFailureAt = lastFailure?.[TIMESTAMP];
          const lastFailureMessage = lastFailure?.[MESSAGE];
          const lastSuccessAt = lastSuccess?.[TIMESTAMP];
          const lastSuccessMessage = lastSuccess?.[MESSAGE];
          const status = (logEntry[RULE_STATUS] as RuleExecutionStatus) || null; // TODO fix type casting
          const lastLookBackDate = lookBack?.[getMetricField(ExecutionMetric.indexingLookback)];
          const gap = executionGap ? moment.duration(executionGap).humanize() : null;
          const bulkCreateTimeDurations = indexingDuration
            ? [makeFloatString(indexingDuration)]
            : null;
          const searchAfterTimeDurations = searchDuration
            ? [makeFloatString(searchDuration)]
            : null;

          return {
            alertId,
            statusDate,
            lastFailureAt,
            lastFailureMessage,
            lastSuccessAt,
            lastSuccessMessage,
            status,
            lastLookBackDate,
            gap,
            bulkCreateTimeDurations,
            searchAfterTimeDurations,
          };
        }),
      ])
    );
  }

  public async logExecutionMetric<T extends ExecutionMetric>({
    ruleId,
    namespace,
    metric,
    value,
    spaceId,
  }: ExecutionMetricArgs<T>) {
    await this.create(
      {
        [SPACE_IDS]: [spaceId],
        [EVENT_ACTION]: metric,
        [EVENT_KIND]: 'metric',
        [getMetricField(metric)]: value,
        [RULE_ID]: ruleId,
        [TIMESTAMP]: new Date().toISOString(),
      },
      namespace
    );
  }

  public async logStatusChange({
    ruleId,
    newStatus,
    namespace,
    message,
    spaceId,
  }: StatusChangeArgs) {
    await this.create(
      {
        [SPACE_IDS]: [spaceId],
        [EVENT_ACTION]: 'status-change',
        [EVENT_KIND]: 'event',
        [EVENT_SEQUENCE]: this.#sequence++, // TODO handle int overflow ?
        [MESSAGE]: message,
        [RULE_ID]: ruleId,
        [RULE_STATUS_SEVERITY]: statusSeverityDict[newStatus],
        [RULE_STATUS]: newStatus,
        [TIMESTAMP]: new Date().toISOString(),
      },
      namespace
    );
  }

  public async create(event: RuleExecutionEvent, namespace?: string) {
    if (!this.#isWriteEnabled) {
      return;
    }
    await this.#ruleDataClient.getWriter({ namespace }).bulk({
      body: [{ index: {} }, event],
    });
  }
}
