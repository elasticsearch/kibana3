/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { useResizeObserver } from '@elastic/eui';
import { IInterpreterRenderHandlers } from '../../../expressions';
import { NodeDimensions, ProgressRendererConfig } from '../../common/types';
import { shapes } from './shapes';
import {
  getId,
  getShapeContentElement,
  SvgTextAttributes,
} from '../../../presentation_util/public';
import { getTextAttributes, getViewBox } from './utils';

interface ProgressComponentProps extends ProgressRendererConfig {
  onLoaded: IInterpreterRenderHandlers['done'];
  parentNode: HTMLElement;
}

function ProgressComponent({
  onLoaded,
  parentNode,
  shape: shapeType,
  value,
  max,
  valueColor,
  barColor,
  valueWeight,
  barWeight,
  label,
  font,
}: ProgressComponentProps) {
  const parentNodeDimensions = useResizeObserver(parentNode);
  const [dimensions, setDimensions] = useState<NodeDimensions>({
    width: parentNode.offsetWidth,
    height: parentNode.offsetHeight,
  });
  const [totalLength, setTotalLength] = useState<number>(0);

  useEffect(() => {
    setDimensions({
      width: parentNode.offsetWidth,
      height: parentNode.offsetHeight,
    });
    onLoaded();
  }, [onLoaded, parentNode, parentNodeDimensions]);

  const barProgressRef = useRef<
    SVGCircleElement & SVGPathElement & SVGPolygonElement & SVGRectElement
  >(null);
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    setTotalLength(barProgressRef.current ? barProgressRef.current.getTotalLength() : 0);
  }, [shapeType, barProgressRef]);

  const Shape = shapes[shapeType];
  const BarProgress = getShapeContentElement(Shape.data.shapeType);

  const shapeContentAttributes = {
    className: 'canvasProgress__background',
    fill: 'none',
    stroke: barColor,
    strokeWidth: `${barWeight}px`,
    ref: barProgressRef,
  };

  const percent = value / max;
  const to = totalLength * (1 - percent);

  const barProgressAttributes = {
    ...Shape.data.shapeContentAttributes,
    className: 'canvasProgress__value',
    fill: 'none',
    stroke: valueColor,
    strokeWidth: `${valueWeight}px`,
    strokeDasharray: totalLength,
    strokeDashoffset: Math.max(0, to),
  };

  const offset = Math.max(valueWeight, barWeight);

  const viewBox = Shape.data.viewBox;
  const defaultTextAttributes = Shape.data.textAttributes ?? {};

  const { width: labelWidth, height: labelHeight } = textRef.current
    ? textRef.current.getBBox()
    : { width: 0, height: 0 };

  const updatedTextAttributes = getTextAttributes(shapeType, defaultTextAttributes, offset, label);
  const textAttributes: SvgTextAttributes = {
    className: 'canvasProgress__label',
    style: font.spec as CSSProperties,
    ...updatedTextAttributes,
  };

  const updatedViewBox = getViewBox(shapeType, viewBox, offset, labelWidth, labelHeight);
  const shapeAttributes = {
    className: 'canvasProgress',
    id: getId('svg'),
    ...(dimensions || {}),
    viewBox: updatedViewBox,
  };

  return (
    <div className="shapeAligner">
      <Shape.Component
        shapeContentAttributes={shapeContentAttributes}
        shapeAttributes={shapeAttributes}
        textAttributes={{ ...textAttributes, ref: textRef }}
      >
        {BarProgress && <BarProgress {...barProgressAttributes} ref={null} />}
      </Shape.Component>
    </div>
  );
}

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { ProgressComponent as default };
