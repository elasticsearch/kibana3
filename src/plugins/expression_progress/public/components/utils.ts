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

export function getViewBox(
  shapeType: Shape,
  initialViewBox: ViewBoxParams,
  offset: number,
  labelWidth: number = 0,
  labelHeight: number = 0
): ViewBoxParams {
  let { minX, minY, width, height } = initialViewBox;
  if (shapeType !== Shape.HORIZONTAL_BAR) {
    minX -= offset / 2;
    width += offset;
  }

  if (shapeType === Shape.SEMICIRCLE) {
    minY -= offset / 2;
    height += offset / 2;
  }

  if (shapeType !== Shape.VERTICAL_BAR && shapeType !== Shape.SEMICIRCLE) {
    minY -= offset / 2;
    height += offset;
  }

  if (shapeType === Shape.HORIZONTAL_BAR || shapeType === Shape.HORIZONTAL_PILL) {
    width += labelWidth;
  }

  if (shapeType === Shape.VERTICAL_BAR || shapeType === Shape.VERTICAL_PILL) {
    if (labelWidth > width) {
      minX = -labelWidth / 2;
      width = labelWidth;
    }
    minY -= labelHeight;
    height += labelHeight;
  }

  return { minX, minY, width, height };
}

export function getTextAttributes(
  shapeType: Shape,
  textAttributes: SvgTextAttributes,
  offset: number,
  label: string | boolean = ''
) {
  if (!label) return textAttributes;

  let { x, y, textContent } = textAttributes;

  textContent = label ? label.toString() : '';
  if (shapeType === Shape.HORIZONTAL_PILL) {
    x = parseInt(String(textAttributes?.x)!, 10) + offset / 2;
  }
  if (shapeType === Shape.VERTICAL_PILL) {
    y = parseInt(String(textAttributes?.y)!, 10) - offset / 2;
  }
  if (shapeType === Shape.HORIZONTAL_BAR || shapeType === Shape.HORIZONTAL_PILL) {
    x = parseInt(String(textAttributes?.x)!, 10);
  }

  return { x, y, textContent };
}
