/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useRef, useState } from 'react';
import { useResizeObserver } from '@elastic/eui';
import { IInterpreterRenderHandlers } from '../../../expressions';
import { NodeDimensions, ProgressRendererConfig } from '../../common/types';
import { shapes } from './shapes';
import {
  getId,
  SvgElementTypes,
  ViewBoxParams,
  getShapeContentElement,
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

  const [shapeViewBox, setShapeViewBox] = useState<ViewBoxParams>();
  const [shapeElementType, setShapeElementType] = useState<SvgElementTypes>();
  const barProgressRef = useRef<SVGGeometryElement>(null);

  const Shape = shapes[shapeType];
  const BarProgress = shapeElementType ? getShapeContentElement(shapeElementType) : null;

  const shapeAttributes = {
    className: 'canvasProgress',
    id: getId('svg'),
    ...(dimensions || {}),
  };

  const shapeContentAttributes = {
    className: 'canvasProgress__background',
    fill: 'none',
    stroke: barColor,
    strokeWidth: `${barWeight}px`,
  };

  const length = barProgressRef.current ? barProgressRef.current.getTotalLength() : 0;
  const percent = value / max;
  const to = length * (1 - percent);

  const barProgressAttributes = {
    classNames: 'canvasProgress_value',
    fill: 'none',
    stroke: valueColor,
    strokeWidth: `${valueWeight}px`,
    strokeDasharray: length,
    strokeDashoffset: Math.max(0, to),
  };

  const offset = Math.max(valueWeight, barWeight);

  if (shapeViewBox) {
    let { minX, minY, width, height } = shapeViewBox;

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

    const text = shapeSvg.getElementsByTagName('text').item(0);

    if (label && text) {
      text.textContent = String(label);
      text.setAttribute('className', 'canvasProgress__label');

      if (shapeType === 'horizontalPill') {
        text.setAttribute('x', String(parseInt(text.getAttribute('x')!, 10) + offset / 2));
      }
      if (shapeType === 'verticalPill') {
        text.setAttribute('y', String(parseInt(text.getAttribute('y')!, 10) - offset / 2));
      }

      Object.assign(text.style, font.spec);
      shapeSvg.appendChild(text);
      parentNode.appendChild(shapeSvg);

      const { width: labelWidth, height: labelHeight } = text.getBBox();

      if (shapeType === 'horizontalBar' || shapeType === 'horizontalPill') {
        text.setAttribute('x', String(parseInt(text.getAttribute('x')!, 10)));
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

    shapeSvg.setAttribute('viewBox', [minX, minY, width, height].join(' '));
  }
  // handlers.onResize(() => {
  //   shapeSvg.setAttribute('width', String(parentNode.offsetWidth));
  //   shapeSvg.setAttribute('height', String(parentNode.offsetHeight));
  // });
  onLoaded();
  return (
    <div className="shapeAligner">
      <Shape
        shapeContentAttributes={shapeContentAttributes}
        shapeAttributes={shapeAttributes}
        setViewBoxParams={setShapeViewBox}
        setShapeElementType={setShapeElementType}
      >
        {BarProgress && <BarProgress {...barProgressAttributes} ref={barProgressRef as any} />}
      </Shape>
    </div>
  );
}

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { ProgressComponent as default };
