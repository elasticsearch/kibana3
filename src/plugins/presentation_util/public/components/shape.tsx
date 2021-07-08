/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useEffect } from 'react';
import { viewBoxToString } from '../../common/lib';
import { ShapeHocProps, ShapeProps, SvgConfig, SvgElementTypes } from './types';

export const ShapeHOC = (ShapeComponent: typeof Shape, svgParams: SvgConfig) =>
  function ShapeWrapper({
    shapeAttributes,
    shapeContentAttributes,
    setViewBoxParams,
    setShapeElementType,
    children,
  }: ShapeHocProps) {
    const { viewBox: initialViewBox, shapeProps, shapeType } = svgParams;
    useEffect(() => {
      setViewBoxParams(svgParams.viewBox);
      setShapeElementType?.(svgParams.shapeType ?? SvgElementTypes.polygon);
    }, [setViewBoxParams, setShapeElementType]);

    const viewBox = shapeAttributes?.viewBox
      ? viewBoxToString(shapeAttributes?.viewBox)
      : viewBoxToString(initialViewBox);

    return (
      <ShapeComponent
        shapeAttributes={{ ...(shapeAttributes || {}), viewBox }}
        shapeContentAttributes={{ ...(shapeContentAttributes || {}), ...shapeProps }}
        shapeType={shapeType ?? SvgElementTypes.polygon}
      >
        {children}
      </ShapeComponent>
    );
  };

export function getShapeContentElement(type: SvgElementTypes) {
  switch (type) {
    case SvgElementTypes.circle:
      return (props: ShapeProps<SVGCircleElement>['shapeContentAttributes']) => (
        <circle {...props} />
      );
    case SvgElementTypes.rect:
      return (props: ShapeProps<SVGRectElement>['shapeContentAttributes']) => <rect {...props} />;
    case SvgElementTypes.path:
      return (props: ShapeProps<SVGPathElement>['shapeContentAttributes']) => <path {...props} />;
    case SvgElementTypes.polygon:
      return (props: ShapeProps<SVGPolygonElement>['shapeContentAttributes']) => (
        <polygon {...props} />
      );
  }
}

export function Shape({
  shapeAttributes,
  shapeContentAttributes,
  shapeType,
  textAttributes,
  children,
}: ShapeProps<any>) {
  const SvgContentElement = getShapeContentElement(shapeType);
  const SvgTextElement = textAttributes ? <text {...textAttributes} /> : null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...shapeAttributes}>
      {SvgContentElement && <SvgContentElement {...shapeContentAttributes} />}
      {SvgTextElement}
      {children}
    </svg>
  );
}

export const getShapeComponent = (props: SvgConfig) => ShapeHOC(Shape, props);

export type ShapeType = ReturnType<typeof getShapeComponent>;
