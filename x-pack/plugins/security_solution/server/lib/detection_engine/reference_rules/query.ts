/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { performance } from 'perf_hooks';
import type { estypes } from '@elastic/elasticsearch';
import { schema } from '@kbn/config-schema';
import { Logger } from '@kbn/logging';
import { ESSearchRequest } from 'src/core/types/elasticsearch';
import { buildEsQuery, IIndexPattern } from '../../../../../../../src/plugins/data/common';
import {
  AlertTypeWithExecutor,
  createPersistenceRuleTypeFactory,
  PersistenceRuleTypeServices,
  RuleDataClient,
} from '../../../../../rule_registry/server';
import { CUSTOM_ALERT_TYPE_ID } from '../../../../common/constants';
import { IRuleExecutionLogClient } from '../rule_execution_log/rule_execution_log_client';
import { ExecutionMetric } from '../rule_execution_log/types';
import {
  ExecutionLogServices,
  withRuleExecutionLogFactory,
} from '../rule_execution_log/with_rule_execution_log';

interface QueryRuleTypeContext {
  [x: string]: unknown;
}

const queryRuleType: AlertTypeWithExecutor<
  { indexPatterns: string[]; customQuery: string },
  QueryRuleTypeContext,
  PersistenceRuleTypeServices<QueryRuleTypeContext> & ExecutionLogServices
> = {
  id: CUSTOM_ALERT_TYPE_ID,
  name: 'Custom Query Rule',
  validate: {
    params: schema.object({
      indexPatterns: schema.arrayOf(schema.string()),
      customQuery: schema.string(),
    }),
  },
  actionGroups: [
    {
      id: 'default',
      name: 'Default',
    },
  ],
  defaultActionGroupId: 'default',
  actionVariables: {
    context: [{ name: 'server', description: 'the server' }],
  },
  minimumLicenseRequired: 'basic',
  isExportable: false,
  producer: 'security-solution',
  async executor({
    services: { alertWithPersistence, findAlerts, ruleExecutionLogClient },
    params: { indexPatterns, customQuery },
    alertId,
    spaceId,
  }) {
    const indexPattern: IIndexPattern = {
      fields: [],
      title: indexPatterns.join(),
    };

    // TODO: kql or lucene?
    const esQuery = buildEsQuery(
      indexPattern,
      { query: customQuery, language: 'kuery' },
      []
    ) as estypes.QueryDslQueryContainer;
    const query: ESSearchRequest = {
      body: {
        query: esQuery,
        fields: ['*'],
        sort: {
          '@timestamp': 'asc' as const,
        },
      },
    };

    const start = performance.now();
    const alerts = await findAlerts(query);
    const end = performance.now();

    ruleExecutionLogClient.logExecutionMetric({
      ruleId: alertId,
      metric: ExecutionMetric.searchDurationMax,
      value: end - start,
      spaceId,
    });

    alertWithPersistence(alerts).forEach((alert) => {
      alert.scheduleActions('default', { server: 'server-test' });
    });

    return {
      lastChecked: new Date(),
    };
  },
};

export const createQueryAlertType = (
  ruleDataClient: RuleDataClient,
  logger: Logger,
  ruleExecutionLogClient: IRuleExecutionLogClient
) => {
  const createPersistenceRuleType = createPersistenceRuleTypeFactory({ ruleDataClient, logger });
  const withRuleExecutionLog = withRuleExecutionLogFactory({
    ruleExecutionLogClient,
    logger,
  });

  return withRuleExecutionLog(createPersistenceRuleType(queryRuleType));
};
