/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { transformError } from '@kbn/securitysolution-es-utils';
import { RuleDataClient } from '../../../../../../rule_registry/server';
import { findRuleValidateTypeDependents } from '../../../../../common/detection_engine/schemas/request/find_rules_type_dependents';
import {
  findRulesSchema,
  FindRulesSchemaDecoded,
} from '../../../../../common/detection_engine/schemas/request/find_rules_schema';
import type { SecuritySolutionPluginRouter } from '../../../../types';
import { DETECTION_ENGINE_RULES_URL } from '../../../../../common/constants';
import { findRules } from '../../rules/find_rules';
import { buildSiemResponse } from '../utils';
import { ruleStatusSavedObjectsClientFactory } from '../../signals/rule_status_saved_objects_client';
import { buildRouteValidation } from '../../../../utils/build_validation/route_validation';
import { transformFindAlerts } from './utils';
import { getBulkRuleActionsSavedObject } from '../../rule_actions/get_bulk_rule_actions_saved_object';
import { RuleExecutionLogClient } from '../../rule_execution_log/rule_execution_log_client';
import { parseExperimentalConfigValue } from '../../../../../common/experimental_features';
import { ConfigType } from '../../../../config';

export const findRulesRoute = (
  router: SecuritySolutionPluginRouter,
  config: ConfigType,
  ruleDataClient?: RuleDataClient | null,
  ruleExecutionLogClient?: RuleExecutionLogClient | null
) => {
  router.get(
    {
      path: `${DETECTION_ENGINE_RULES_URL}/_find`,
      validate: {
        query: buildRouteValidation<typeof findRulesSchema, FindRulesSchemaDecoded>(
          findRulesSchema
        ),
      },
      options: {
        tags: ['access:securitySolution'],
      },
    },
    async (context, request, response) => {
      const siemResponse = buildSiemResponse(response);
      const validationErrors = findRuleValidateTypeDependents(request.query);
      if (validationErrors.length) {
        return siemResponse.error({ statusCode: 400, body: validationErrors });
      }

      try {
        const { query } = request;
        const alertsClient = context.alerting?.getAlertsClient();
        const savedObjectsClient = context.core.savedObjects.client;

        if (!alertsClient) {
          return siemResponse.error({ statusCode: 404 });
        }

        // TODO: Once we are past experimental phase this code should be removed
        const { ruleRegistryEnabled } = parseExperimentalConfigValue(config.enableExperimental);
        if (!ruleExecutionLogClient && ruleRegistryEnabled) {
          return siemResponse.error({ statusCode: 404 });
        }

        const ruleStatusClient = ruleStatusSavedObjectsClientFactory(savedObjectsClient);
        const rules = await findRules({
          alertsClient,
          perPage: query.per_page,
          page: query.page,
          sortField: query.sort_field,
          sortOrder: query.sort_order,
          filter: query.filter,
          fields: query.fields,
        });
        const alertIds = rules.data.map((rule) => rule.id);

        const [ruleStatuses, ruleActions] = await Promise.all([
          ruleRegistryEnabled
            ? ruleExecutionLogClient!.findBulk({
                ruleIds: alertIds,
                spaceId: context.securitySolution.getSpaceId(),
              })
            : ruleStatusClient.findBulk(alertIds, 1),
          getBulkRuleActionsSavedObject({ alertIds, savedObjectsClient }),
        ]);
        const transformed = transformFindAlerts(rules, ruleActions, ruleStatuses);
        if (transformed == null) {
          return siemResponse.error({ statusCode: 500, body: 'Internal error transforming' });
        } else {
          return response.ok({ body: transformed ?? {} });
        }
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
