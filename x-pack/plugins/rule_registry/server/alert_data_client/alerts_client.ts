/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { PublicMethodsOf } from '@kbn/utility-types';
import { decodeVersion, encodeHitVersion } from '@kbn/securitysolution-es-utils';
import { AlertTypeParams, AlertingAuthorizationFilterType } from '../../../alerting/server';
import {
  ReadOperations,
  AlertingAuthorization,
  WriteOperations,
  AlertingAuthorizationEntity,
} from '../../../alerting/server';
import { Logger, ElasticsearchClient } from '../../../../../src/core/server';
import { alertAuditEvent, AlertAuditAction } from './audit_events';
import { AuditLogger } from '../../../security/server';
import {
  ALERT_STATUS,
  OWNER,
  RULE_ID,
  SPACE_IDS,
} from '../../common/technical_rule_data_field_names';
import { ParsedTechnicalFields } from '../../common/parse_technical_fields';
import { mapConsumerToIndexName, validFeatureIds, isValidFeatureId } from '../utils/rbac';

// TODO: Fix typings https://github.com/elastic/kibana/issues/101776
type NonNullableProps<Obj extends {}, Props extends keyof Obj> = Omit<Obj, Props> &
  { [K in Props]-?: NonNullable<Obj[K]> };
type AlertType = NonNullableProps<ParsedTechnicalFields, 'rule.id' | 'kibana.rac.alert.owner'>;

const isValidAlert = (source?: ParsedTechnicalFields): source is AlertType => {
  return source?.[RULE_ID] != null && source?.[OWNER] != null;
};
export interface ConstructorOptions {
  logger: Logger;
  authorization: PublicMethodsOf<AlertingAuthorization>;
  auditLogger?: AuditLogger;
  esClient: ElasticsearchClient;
}

export interface UpdateOptions<Params extends AlertTypeParams> {
  id: string;
  status: string;
  _version: string | undefined;
  index: string;
}

export interface BulkUpdateOptions<Params extends AlertTypeParams> {
  ids: string[];
  status: string;
  index: string;
  query: object;
}

interface GetAlertParams {
  id?: string;
  index?: string;
  query?: object;
}

/**
 * Provides apis to interact with alerts as data
 * ensures the request is authorized to perform read / write actions
 * on alerts as data.
 */
export class AlertsClient {
  private readonly logger: Logger;
  private readonly auditLogger?: AuditLogger;
  private readonly authorization: PublicMethodsOf<AlertingAuthorization>;
  private readonly esClient: ElasticsearchClient;
  private readonly spaceId: Promise<string | undefined>;

  constructor({ auditLogger, authorization, logger, esClient }: ConstructorOptions) {
    this.logger = logger;
    this.authorization = authorization;
    this.esClient = esClient;
    this.auditLogger = auditLogger;
    this.spaceId = this.authorization.getSpaceId();
  }

  public async getAlertsIndex(
    featureIds: string[],
    operations: Array<ReadOperations | WriteOperations>
  ) {
    return this.authorization.getAugmentedRuleTypesWithAuthorization(
      featureIds.length !== 0 ? featureIds : validFeatureIds,
      operations,
      AlertingAuthorizationEntity.Alert
    );
  }

  private async fetchAlert({
    id,
    index,
    query,
  }: GetAlertParams): Promise<(AlertType & { _version: string | undefined }) | null | undefined> {
    try {
      const alertSpaceId = await this.spaceId;
      if (alertSpaceId == null) {
        this.logger.error('Failed to acquire spaceId from authorization client');
        return;
      }
      const result = await this.esClient.search<ParsedTechnicalFields>({
        // Context: Originally thought of always just searching `.alerts-*` but that could
        // result in a big performance hit. If the client already knows which index the alert
        // belongs to, passing in the index will speed things up
        index: index ?? '.alerts-*',
        ignore_unavailable: true,
        body: {
          query: { term: { _id: id! } },
          aggs: { ruleTypeIdsAgg: { terms: { field: RULE_ID } } },
        },
        seq_no_primary_term: true,
      });

      if (result == null || result.body == null || result.body.hits.hits.length === 0) {
        return;
      }

      if (!isValidAlert(result.body.hits.hits[0]._source)) {
        const errorMessage = `Unable to retrieve alert details for alert with id of "${id}".`;
        this.logger.debug(errorMessage);
        throw new Error(errorMessage);
      }

      return {
        ...result.body.hits.hits[0]._source,
        _version: encodeHitVersion(result.body.hits.hits[0]),
      };
    } catch (error) {
      const errorMessage = `Unable to retrieve alert with id of "${id}".`;
      this.logger.debug(errorMessage);
      throw error;
    }
  }

  private async fetchAlerts({
    ids,
    index,
    query,
  }: {
    ids: string[];
    index: string;
    query: object;
  }): Promise<(AlertType & { _version: string | undefined }) | null | undefined> {
    try {
      // const afilter = await this.authorization.getFindAuthorizationFilter(
      //   AlertingAuthorizationEntity.Alert,
      //   {
      //     type: AlertingAuthorizationFilterType.ESDSL,
      //     fieldNames: { consumer: 'kibana.rac.alert.owner', ruleTypeId: 'rule.id' },
      //   },
      //   WriteOperations.Update
      // );
      // console.error('WHAT IS THIS', JSON.stringify(afilter, null, 2));
      const result = await this.esClient.search<ParsedTechnicalFields>({
        // Context: Originally thought of always just searching `.alerts-*` but that could
        // result in a big performance hit. If the client already knows which index the alert
        // belongs to, passing in the index will speed things up
        index: index ?? '.alerts-*',
        ignore_unavailable: true,
        body: {
          query: query == null ? { ids: { values: ids } } : query,
          aggs: { ruleTypeIdsAgg: { terms: { field: RULE_ID } } },
        },
        seq_no_primary_term: true,
      });

      console.error('RESULT', JSON.stringify(result, null, 2));

      const {
        authorizedRuleTypes: allowedRuleTypeIds,
      } = await this.authorization.getAugmentedRuleTypesWithAuthorization(
        validFeatureIds,
        [WriteOperations.Update],
        AlertingAuthorizationEntity.Alert
      );

      // if (
      //   result.body?.aggregations?.ruleTypeIdsAgg.buckets.every((bucketItem) =>
      //     allowedRuleTypeIds.has(bucketItem.key)
      //   )
      // ) {

      // }
      if (result == null || result.body == null || result.body.hits.hits.length === 0) {
        return;
      }

      if (!isValidAlert(result.body.hits.hits[0]._source)) {
        const errorMessage = `Unable to retrieve alert details for alert with id of "${ids}".`;
        this.logger.debug(errorMessage);
        throw new Error(errorMessage);
      }

      return {
        ...result.body.hits.hits[0]._source,
        _version: encodeHitVersion(result.body.hits.hits[0]),
      };
    } catch (error) {
      const errorMessage = `Unable to retrieve alert with id of "${ids}".`;
      this.logger.debug(errorMessage);
      throw error;
    }
  }

  public async get({
    id,
    index,
  }: GetAlertParams): Promise<ParsedTechnicalFields | null | undefined> {
    try {
      // first search for the alert by id, then use the alert info to check if user has access to it
      const alert = await this.fetchAlert({
        id,
        index,
      });

      if (alert == null) {
        return;
      }

      // this.authorization leverages the alerting plugin's authorization
      // client exposed to us for reuse
      await this.authorization.ensureAuthorized({
        ruleTypeId: alert[RULE_ID],
        consumer: alert[OWNER],
        operation: ReadOperations.Get,
        entity: AlertingAuthorizationEntity.Alert,
      });

      this.auditLogger?.log(
        alertAuditEvent({
          action: AlertAuditAction.GET,
          id,
        })
      );

      return alert;
    } catch (error) {
      this.logger.debug(`Error fetching alert with id of "${id}"`);
      this.auditLogger?.log(
        alertAuditEvent({
          action: AlertAuditAction.GET,
          id,
          error,
        })
      );
      throw error;
    }
  }

  public async update<Params extends AlertTypeParams = never>({
    id,
    status,
    _version,
    index,
  }: UpdateOptions<Params>) {
    try {
      const alert = await this.fetchAlert({
        id,
        index,
      });

      if (alert == null) {
        return;
      }

      await this.authorization.ensureAuthorized({
        ruleTypeId: alert[RULE_ID],
        consumer: alert[OWNER],
        operation: WriteOperations.Update,
        entity: AlertingAuthorizationEntity.Alert,
      });

      this.auditLogger?.log(
        alertAuditEvent({
          action: AlertAuditAction.UPDATE,
          id,
          outcome: 'unknown',
        })
      );

      const { body: response } = await this.esClient.update<ParsedTechnicalFields>({
        ...decodeVersion(_version),
        id,
        index,
        body: {
          doc: {
            [ALERT_STATUS]: status,
          },
        },
        refresh: 'wait_for',
      });

      return {
        ...response,
        _version: encodeHitVersion(response),
      };
    } catch (error) {
      this.auditLogger?.log(
        alertAuditEvent({
          action: AlertAuditAction.UPDATE,
          id,
          error,
        })
      );
      throw error;
    }
  }

  public async bulkUpdate<Params extends AlertTypeParams = never>({
    ids,
    query,
    index,
    status,
  }: BulkUpdateOptions<Params>) {
    let queryObject;
    if (ids) {
      // maybe use an aggs query to make this fast
      // queryObject = {
      //   ids: { values: ids },
      //   // // USE AGGS and then get returned fields against ensureAuthorizedForAllRuleTypes
      //   // @ts-expect-error
      //   aggs: {
      //     ...(await this.authorization.getFindAuthorizationFilter(
      //       AlertingAuthorizationEntity.Alert,
      //       {
      //         type: AlertingAuthorizationFilterType.ESDSL,
      //         fieldNames: { consumer: 'kibana.rac.alert.owner', ruleTypeId: 'rule.id' },
      //       },
      //       WriteOperations.Update
      //     )),
      //   },
      // };
      const fetchAlertsRes = await this.fetchAlerts({ index, ids });
    } else if (query) {
      queryObject = {
        bool: {
          ...query,
        },
      };
    }
    try {
      // USE AGGS FOR QUERY, GET THE HITS AND THEN DO BULK UPDATE WITH IDS AND AUDIT LOG THAT
      const result = await this.esClient.updateByQuery({
        index,
        conflicts: 'abort', // conflicts ?? 'abort',
        // @ts-expect-error refresh should allow for 'wait_for'
        // refresh: 'wait_for',
        refresh: true,
        body: {
          script: {
            source: `ctx._source['kibana.rac.alert.status'] = '${status}'`,
            lang: 'painless',
          },
          query: queryObject,
        },
        ignore_unavailable: true,
      });
      return result;
    } catch (err) {
      // TODO: Update error message
      this.logger.error('');
      console.error('UPDATE ERROR', JSON.stringify(err, null, 2));
      throw err;
    }
    // Looking like we may need to first fetch the alerts to ensure we are
    // pulling the correct ruleTypeId and owner
    // await this.esClient.mget()

    // try {
    //   // ASSUMPTION: user bulk updating alerts from single owner/space
    //   // may need to iterate to support rules shared across spaces

    //   const ruleTypes = await this.authorization.ensureAuthorizedForAllRuleTypes({
    //     owner,
    //     operation: WriteOperations.Update,
    //     entity: AlertingAuthorizationEntity.Alert,
    //   });

    //   const totalRuleTypes = this.authorization.getRuleTypesByProducer(owner);

    //   console.error('RULE TYPES', ruleTypes);

    //   // await this.authorization.ensureAuthorized({
    //   //   ruleTypeId: 'siem.signals', // can they update multiple at once or will a single one just be passed in?
    //   //   consumer: owner,
    //   //   operation: WriteOperations.Update,
    //   //   entity: AlertingAuthorizationEntity.Alert,
    //   // });

    //   try {
    //     const index = this.authorization.getAuthorizedAlertsIndices(owner);
    //     if (index == null) {
    //       throw Error(`cannot find authorized index for owner: ${owner}`);
    //     }

    //     const body = ids.flatMap((id) => [
    //       {
    //         update: {
    //           _id: id,
    //           _index: this.authorization.getAuthorizedAlertsIndices(ruleTypes[0].producer),
    //         },
    //       },
    //       {
    //         doc: { 'kibana.rac.alert.status': data.status },
    //       },
    //     ]);

    //     const result = await this.esClient.bulk({
    //       index,
    //       body,
    //     });
    //     return result;
    //   } catch (updateError) {
    //     this.logger.error(
    //       `Unable to bulk update alerts for ${owner}. Error follows: ${updateError}`
    //     );
    //     throw updateError;
    //   }
    // } catch (error) {
    //   console.error("HERE'S THE ERROR", error);
    //   throw Boom.forbidden(
    //     this.auditLogger.racAuthorizationFailure({
    //       owner,
    //       operation: ReadOperations.Get,
    //       type: 'access',
    //     })
    //   );
    // }
  }

  public async getAuthorizedAlertsIndices(featureIds: string[]): Promise<string[] | undefined> {
    const augmentedRuleTypes = await this.authorization.getAugmentedRuleTypesWithAuthorization(
      featureIds,
      [ReadOperations.Find, ReadOperations.Get, WriteOperations.Update],
      AlertingAuthorizationEntity.Alert
    );

    // As long as the user can read a minimum of one type of rule type produced by the provided feature,
    // the user should be provided that features' alerts index.
    // Limiting which alerts that user can read on that index will be done via the findAuthorizationFilter
    const authorizedFeatures = new Set<string>();
    for (const ruleType of augmentedRuleTypes.authorizedRuleTypes) {
      authorizedFeatures.add(ruleType.producer);
    }

    const toReturn = Array.from(authorizedFeatures).flatMap((feature) => {
      if (isValidFeatureId(feature)) {
        return mapConsumerToIndexName[feature];
      }
      return [];
    });

    return toReturn;
  }
}
