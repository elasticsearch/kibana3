/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export enum ExecutionMetric {
  'executionGap' = 'executionGap',
  'searchDurationMax' = 'searchDurationMax',
  'indexingDurationMax' = 'indexingDurationMax',
  'indexingLookback' = 'indexingLookback',
}

export type ExecutionMetricValue<T extends ExecutionMetric> = {
  [ExecutionMetric.executionGap]: number;
  [ExecutionMetric.searchDurationMax]: number;
  [ExecutionMetric.indexingDurationMax]: number;
  [ExecutionMetric.indexingLookback]: Date;
}[T];
