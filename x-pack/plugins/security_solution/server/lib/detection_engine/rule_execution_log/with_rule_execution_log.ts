/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Logger } from '@kbn/logging';

import { IRuleExecutionLogClient } from './rule_execution_log_client';
import { AlertTypeWithExecutor } from '../../../../../rule_registry/server';
import { AlertInstanceContext, AlertTypeParams } from '../../../../../alerting/common';
import { RuleExecutionStatus } from '../../../../common/detection_engine/schemas/common/schemas';

export interface ExecutionLogServices {
  ruleExecutionLogClient: IRuleExecutionLogClient;
  logger: Logger;
}

type WithRuleExecutionLog = (args: {
  ruleExecutionLogClient: IRuleExecutionLogClient;
  logger: Logger;
}) => <
  TParams extends AlertTypeParams,
  TAlertInstanceContext extends AlertInstanceContext,
  TServices extends ExecutionLogServices
>(
  type: AlertTypeWithExecutor<TParams, TAlertInstanceContext, TServices>
) => AlertTypeWithExecutor<TParams, TAlertInstanceContext, TServices>;

export const withRuleExecutionLogFactory: WithRuleExecutionLog = ({
  ruleExecutionLogClient,
  logger,
}) => (type) => {
  return {
    ...type,
    executor: async (options) => {
      try {
        await ruleExecutionLogClient.logStatusChange({
          spaceId: options.spaceId,
          ruleId: options.alertId,
          newStatus: RuleExecutionStatus['going to run'],
        });

        const state = await type.executor({
          ...options,
          services: {
            ...options.services,
            ruleExecutionLogClient,
            logger,
          },
        });

        await ruleExecutionLogClient.logStatusChange({
          spaceId: options.spaceId,
          ruleId: options.alertId,
          newStatus: RuleExecutionStatus.succeeded,
        });

        return state;
      } catch (error) {
        logger.error(error);
        await ruleExecutionLogClient.logStatusChange({
          spaceId: options.spaceId,
          ruleId: options.alertId,
          newStatus: RuleExecutionStatus.failed,
          message: error.message,
        });
      }
    },
  };
};
