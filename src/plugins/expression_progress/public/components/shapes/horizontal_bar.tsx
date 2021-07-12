/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import { createShape, SvgElementTypes } from '../../../../presentation_util/public';

export const HorizontalBar = createShape({
  viewBox: {
    minX: 0,
    minY: 0,
    width: 208,
    height: 1,
  },
  shapeType: SvgElementTypes.path,
  shapeContentAttributes: {
    d: 'M 0 1 L 200 1',
  },
  textAttributes: {
    x: 208,
    y: 0,
    textAnchor: 'start',
    dominantBaseline: 'central',
  },
});
