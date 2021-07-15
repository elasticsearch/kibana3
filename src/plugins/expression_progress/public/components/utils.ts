/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { SvgTextAttributes } from 'src/plugins/presentation_util/public';
import { ViewBoxParams } from '../../../presentation_util/common';
import { Shape } from '../../common';

type GetViewBox = (
  shapeType: Shape,
  initialViewBox: ViewBoxParams,
  offset: number,
  labelWidth: number,
  labelHeight: number
) => ViewBoxParams;

type GetViewBoxArguments = Parameters<GetViewBox>;
type GetViewBoxParam = (...args: GetViewBoxArguments) => number;

const getMinX: GetViewBoxParam = (shapeType, viewBox, offset = 0) => {
  let { minX } = viewBox;
  if (shapeType !== Shape.HORIZONTAL_BAR) minX -= offset / 2;
  return minX;
};

const getMinY: GetViewBoxParam = (shapeType, viewBox, offset = 0, labelWidth, labelHeight = 0) => {
  let { minY } = viewBox;
  if (shapeType === Shape.SEMICIRCLE) minY -= offset / 2;
  if (shapeType !== Shape.SEMICIRCLE && shapeType !== Shape.VERTICAL_BAR) {
    minY -= offset / 2;
  }
  if (shapeType === Shape.VERTICAL_BAR || shapeType === Shape.VERTICAL_PILL) {
    minY -= labelHeight;
  }
  return minY;
};

const getWidth: GetViewBoxParam = (shapeType, viewBox, offset = 0, labelWidth = 0) => {
  let { width } = viewBox;
  if (shapeType !== Shape.HORIZONTAL_BAR) width += offset;
  if (shapeType === Shape.HORIZONTAL_BAR || shapeType === Shape.HORIZONTAL_PILL) {
    width += labelWidth;
  }
  return width;
};

const getHeight: GetViewBoxParam = (
  shapeType,
  viewBox,
  offset = 0,
  labelWidth = 0,
  labelHeight = 0
) => {
  let { height } = viewBox;
  if (shapeType === Shape.SEMICIRCLE) height += offset / 2;
  if (shapeType !== Shape.SEMICIRCLE && shapeType !== Shape.VERTICAL_BAR) {
    height += offset;
  }
  if (shapeType === Shape.VERTICAL_BAR || shapeType === Shape.VERTICAL_PILL) {
    height += labelHeight;
  }
  return height;
};

const updateMinxAndWidthIfNecessary = (
  shapeType: Shape,
  labelWidth: number,
  minX: number,
  width: number
) => {
  if (
    (shapeType === Shape.VERTICAL_BAR || shapeType === Shape.VERTICAL_PILL) &&
    labelWidth > width
  ) {
    minX = -labelWidth / 2;
    width = labelWidth;
  }
  return [minX, width];
};

export const getViewBox: GetViewBox = function (
  shapeType,
  viewBox,
  offset = 0,
  labelWidth = 0,
  labelHeight = 0
): ViewBoxParams {
  const args: GetViewBoxArguments = [shapeType, viewBox, offset, labelWidth, labelHeight];
  const minX = getMinX(...args);
  const minY = getMinY(...args);
  const width = getWidth(...args);
  const height = getHeight(...args);
  const [updatedMinX, updatedWidth] = updateMinxAndWidthIfNecessary(
    shapeType,
    labelWidth,
    minX,
    width
  );
  return { minX: updatedMinX, minY, width: updatedWidth, height };
};

export function getTextAttributes(
  shapeType: Shape,
  textAttributes: SvgTextAttributes,
  offset: number = 0,
  label: string | boolean = ''
) {
  if (!label) return textAttributes;

  let { x, y, textContent } = textAttributes;

  textContent = label ? label.toString() : '';

  if (shapeType === Shape.HORIZONTAL_PILL) {
    x = parseInt(String(x)!, 10) + offset / 2;
  }
  if (shapeType === Shape.VERTICAL_PILL) {
    y = parseInt(String(y)!, 10) - offset / 2;
  }
  if (shapeType === Shape.HORIZONTAL_BAR || shapeType === Shape.HORIZONTAL_PILL) {
    x = parseInt(String(x)!, 10);
  }

  return { x, y, textContent };
}
