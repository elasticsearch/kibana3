/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { metricFunction } from '../../../../../../src/plugins/expression_metric/common';
import { shapeFunction } from '../../../../../../src/plugins/expression_shape/common';

export const functions = [metricFunction, shapeFunction];
