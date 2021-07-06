/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import { ExpressionFunctionDefinition, ExpressionValueRender, Style } from '../../../expressions';

export enum Shape {
  GAUGE = 'gauge',
  HORIZONTAL_BAR = 'horizontalBar',
  HORIZONTAL_PILL = 'horizontalPill',
  SEMICIRCLE = 'semicircle',
  UNICORN = 'unicorn',
  VERTICAL_BAR = 'verticalBar',
  VERTICAL_PILL = 'verticalPill',
  WHEEL = 'wheel',
}

export interface Arguments {
  barColor: string;
  barWeight: number;
  font: Style;
  label: boolean | string;
  max: number;
  shape: Shape;
  valueColor: string;
  valueWeight: number;
}

export type Output = Arguments & {
  value: number;
};

export type ExpressionProgressFunction = () => ExpressionFunctionDefinition<
  'progress',
  number,
  Arguments,
  ExpressionValueRender<Arguments>
>;
