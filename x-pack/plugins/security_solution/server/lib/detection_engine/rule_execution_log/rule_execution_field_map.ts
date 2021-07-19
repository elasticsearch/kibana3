/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { RULE_STATUS, RULE_STATUS_SEVERITY } from './constants';

export const ruleExecutionFieldMap = {
  [RULE_STATUS]: { type: 'keyword' },
  [RULE_STATUS_SEVERITY]: { type: 'integer' },
} as const;

export type RuleExecutionFieldMap = typeof ruleExecutionFieldMap;
