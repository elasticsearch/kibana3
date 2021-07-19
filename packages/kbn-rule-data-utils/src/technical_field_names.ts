/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ValuesType } from 'utility-types';

const ALERT_NAMESPACE = 'kibana.rac.alert' as const;

export const TIMESTAMP = '@timestamp' as const;
export const MESSAGE = 'message' as const;
export const EVENT_KIND = 'event.kind' as const;
export const EVENT_ACTION = 'event.action' as const;
export const EVENT_SEQUENCE = 'event.sequence' as const;
export const EVENT_DURATION = 'event.duration' as const;
export const EVENT_START = 'event.start' as const;
export const EVENT_END = 'event.end' as const;
export const RULE_UUID = 'rule.uuid' as const;
export const RULE_ID = 'rule.id' as const;
export const RULE_NAME = 'rule.name' as const;
export const RULE_CATEGORY = 'rule.category' as const;
export const TAGS = 'tags' as const;
export const SPACE_IDS = `kibana.space_ids` as const;
export const PRODUCER = `${ALERT_NAMESPACE}.producer` as const;
export const OWNER = `${ALERT_NAMESPACE}.owner` as const;
export const ALERT_ID = `${ALERT_NAMESPACE}.id` as const;
export const ALERT_UUID = `${ALERT_NAMESPACE}.uuid` as const;
export const ALERT_START = `${ALERT_NAMESPACE}.start` as const;
export const ALERT_END = `${ALERT_NAMESPACE}.end` as const;
export const ALERT_DURATION = `${ALERT_NAMESPACE}.duration.us` as const;
export const ALERT_SEVERITY_LEVEL = `${ALERT_NAMESPACE}.severity.level` as const;
export const ALERT_SEVERITY_VALUE = `${ALERT_NAMESPACE}.severity.value` as const;
export const ALERT_STATUS = `${ALERT_NAMESPACE}.status` as const;
export const ALERT_EVALUATION_THRESHOLD = `${ALERT_NAMESPACE}.evaluation.threshold` as const;
export const ALERT_EVALUATION_VALUE = `${ALERT_NAMESPACE}.evaluation.value` as const;

const fields = {
  TIMESTAMP,
  MESSAGE,
  EVENT_KIND,
  EVENT_ACTION,
  EVENT_SEQUENCE,
  EVENT_DURATION,
  EVENT_START,
  EVENT_END,
  RULE_UUID,
  RULE_ID,
  RULE_NAME,
  RULE_CATEGORY,
  TAGS,
  PRODUCER,
  OWNER,
  ALERT_ID,
  ALERT_UUID,
  ALERT_START,
  ALERT_END,
  ALERT_DURATION,
  ALERT_SEVERITY_LEVEL,
  ALERT_SEVERITY_VALUE,
  ALERT_STATUS,
  ALERT_EVALUATION_THRESHOLD,
  ALERT_EVALUATION_VALUE,
  SPACE_IDS,
};

export type TechnicalRuleDataFieldName = ValuesType<typeof fields>;
