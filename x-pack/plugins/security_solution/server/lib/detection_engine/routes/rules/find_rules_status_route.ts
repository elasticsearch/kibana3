/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { transformError } from '@kbn/securitysolution-es-utils';
import { buildRouteValidation } from '../../../../utils/build_validation/route_validation';
import type { SecuritySolutionPluginRouter } from '../../../../types';
import { DETECTION_ENGINE_RULES_URL } from '../../../../../common/constants';
import { buildSiemResponse, mergeStatuses, getFailingRules, convertToSnakeCase } from '../utils';
import { ruleStatusSavedObjectsClientFactory } from '../../signals/rule_status_saved_objects_client';
import {
  findRulesStatusesSchema,
  FindRulesStatusesSchemaDecoded,
} from '../../../../../common/detection_engine/schemas/request/find_rule_statuses_schema';
import { mergeAlertWithSidecarStatus } from '../../schemas/rule_converters';
import { ConfigType } from '../../../../config';
import { RuleExecutionLogClient } from '../../rule_execution_log/rule_execution_log_client';
import { parseExperimentalConfigValue } from '../../../../../common/experimental_features';
import { RuleExecutionStatus } from '../../../../../common/detection_engine/schemas/common/schemas';
import { invariant } from '../../../../../common/utils/invariant';

/**
 * Given a list of rule ids, return the current status and
 * last five errors for each associated rule.
 *
 * @param router
 * @returns RuleStatusResponse
 */
export const findRulesStatusesRoute = (
  router: SecuritySolutionPluginRouter,
  config: ConfigType,
  ruleExecutionLogClient?: RuleExecutionLogClient | null
) => {
  router.post(
    {
      path: `${DETECTION_ENGINE_RULES_URL}/_find_statuses`,
      validate: {
        body: buildRouteValidation<typeof findRulesStatusesSchema, FindRulesStatusesSchemaDecoded>(
          findRulesStatusesSchema
        ),
      },
      options: {
        tags: ['access:securitySolution'],
      },
    },
    async (context, request, response) => {
      const { body } = request;
      const siemResponse = buildSiemResponse(response);
      const alertsClient = context.alerting?.getAlertsClient();
      const savedObjectsClient = context.core.savedObjects.client;

      if (!alertsClient) {
        return siemResponse.error({ statusCode: 404 });
      }

      // TODO: Once we are past experimental phase this code should be removed
      const { ruleRegistryEnabled } = parseExperimentalConfigValue(config.enableExperimental);

      const ids = body.ids;
      try {
        if (ruleRegistryEnabled) {
          invariant(
            ruleExecutionLogClient,
            'Rule registry is enabled but RuleExecutionLogClient is not initialized'
          );

          const spaceId = context.securitySolution.getSpaceId();

          const [statusesById, lastErrorsById] = await Promise.all([
            ruleExecutionLogClient.findBulk({ ruleIds: ids, spaceId }),
            ruleExecutionLogClient.findBulk({
              ruleIds: ids,
              statuses: [RuleExecutionStatus.failed],
              logsCount: 5,
              spaceId,
            }),
          ]);

          const statuses = Object.fromEntries(
            Object.entries(statusesById).map(([ruleId, ruleStatuses]) => [
              ruleId,
              {
                current_status: convertToSnakeCase(ruleStatuses[0]),
                failures: (lastErrorsById[ruleId] || []).map(convertToSnakeCase),
              },
            ])
          );

          return response.ok({ body: statuses });
        }

        const ruleStatusClient = ruleStatusSavedObjectsClientFactory(savedObjectsClient);
        const [statusesById, failingRules] = await Promise.all([
          ruleStatusClient.findBulk(ids, 6),
          getFailingRules(ids, alertsClient),
        ]);

        const statuses = ids.reduce((acc, id) => {
          const lastFiveErrorsForId = statusesById[id];

          if (lastFiveErrorsForId == null || lastFiveErrorsForId.length === 0) {
            return acc;
          }

          const failingRule = failingRules[id];

          if (failingRule != null) {
            const currentStatus = mergeAlertWithSidecarStatus(failingRule, lastFiveErrorsForId[0]);
            const updatedLastFiveErrorsSO = [currentStatus, ...lastFiveErrorsForId.slice(1)];
            return mergeStatuses(id, updatedLastFiveErrorsSO, acc);
          }
          return mergeStatuses(id, [...lastFiveErrorsForId], acc);
        }, {});
        return response.ok({ body: statuses });
      } catch (err) {
        const error = transformError(err);
        return siemResponse.error({
          body: error.message,
          statusCode: error.statusCode,
        });
      }
    }
  );
};
