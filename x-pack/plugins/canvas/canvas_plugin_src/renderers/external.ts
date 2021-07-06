/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { errorRenderer } from '../../../../../src/plugins/expression_error/public';
import { imageRenderer } from '../../../../../src/plugins/expression_image/public';
import { repeatImageRenderer } from '../../../../../src/plugins/expression_repeat_image/public';
import { revealImageRenderer } from '../../../../../src/plugins/expression_reveal_image/public';
import { shapeRenderer } from '../../../../../src/plugins/expression_shape/public';

export const renderFunctions = [
  errorRenderer,
  imageRenderer,
  repeatImageRenderer,
  revealImageRenderer,
  shapeRenderer,
];

export const renderFunctionFactories = [];
