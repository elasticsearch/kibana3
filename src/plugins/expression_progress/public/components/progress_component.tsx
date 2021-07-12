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

  const Shape = shapes[shapeType];
  const BarProgress = getShapeContentElement(Shape.data.shapeType);

  const shapeContentAttributes = {
    className: 'canvasProgress__background',
    fill: 'none',
    stroke: barColor,
    strokeWidth: `${barWeight}px`,
    ref: barProgressRef,
  };

  const length = barProgressRef.current ? barProgressRef.current.getTotalLength() : 1;
  const percent = value / max;
  const to = length * (1 - percent);

  const barProgressAttributes = {
    ...Shape.data.shapeContentAttributes,
    className: 'canvasProgress__value',
    fill: 'none',
    stroke: valueColor,
    strokeWidth: `${valueWeight}px`,
    strokeDasharray: length,
    strokeDashoffset: Math.max(0, to),
  };

  const offset = Math.max(valueWeight, barWeight);

  let { minX, minY, width, height } = Shape.data.viewBox;

  if (shapeType !== 'horizontalBar') {
    minX -= offset / 2;
    width += offset;
  }

  if (shapeType === 'semicircle') {
    minY -= offset / 2;
    height += offset / 2;
  } else if (shapeType !== 'verticalBar') {
    minY -= offset / 2;
    height += offset;
  }

  const textAttributes: SvgTextAttributes = {
    x: 0,
    y: 0,
    className: 'canvasProgress__label',
    style: font.spec as CSSProperties,
    textContent: '',
  };

  if (label) {
    textAttributes.textContent = String(label);
    if (shapeType === 'horizontalPill') {
      textAttributes.x = parseInt(String(Shape.data.textAttributes?.x)!, 10) + offset / 2;
    }
    if (shapeType === 'verticalPill') {
      textAttributes.y = parseInt(String(Shape.data.textAttributes?.y)!, 10) - offset / 2;
    }

    const { width: labelWidth, height: labelHeight } = textRef.current
      ? textRef.current.getBBox()
      : { width: 0, height: 0 };

    if (shapeType === 'horizontalBar' || shapeType === 'horizontalPill') {
      textAttributes.x = parseInt(String(Shape.data.textAttributes?.x)!, 10);
      width += labelWidth;
    }
    if (shapeType === 'verticalBar' || shapeType === 'verticalPill') {
      if (labelWidth > width) {
        minX = -labelWidth / 2;
        width = labelWidth;
      }
      minY -= labelHeight;
      height += labelHeight;
    }
  }

  const shapeAttributes = {
    className: 'canvasProgress',
    id: getId('svg'),
    ...(dimensions || {}),
    viewBox: { minX, minY, width, height },
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
