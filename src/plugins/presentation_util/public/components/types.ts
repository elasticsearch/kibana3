/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { LegacyRef, Ref, SVGProps } from 'react';
import { OnSaveProps, SaveModalState } from '../../../../plugins/saved_objects/public';
import { ViewBoxParams } from '../../common/types';

interface SaveModalDocumentInfo {
  id?: string;
  title: string;
  description?: string;
}

export interface SaveModalDashboardProps {
  documentInfo: SaveModalDocumentInfo;
  canSaveByReference: boolean;
  objectType: string;
  onClose: () => void;
  onSave: (props: OnSaveProps & { dashboardId: string | null; addToLibrary: boolean }) => void;
  tagOptions?: React.ReactNode | ((state: SaveModalState) => React.ReactNode);
}

export interface ShapeHocProps {
  children?: JSX.Element | null;
  shapeType?: SvgElementTypes;
  shapeAttributes?: ShapeAttributes;
  shapeContentAttributes?: ShapeContentAttributes;
  setViewBoxParams: (viewBoxParams?: ViewBoxParams) => void;
  setShapeElementType?: (shapeElementType: SvgElementTypes) => void;
}

export interface ShapeProps<T extends SVGGraphicsElement> {
  shapeAttributes: Omit<ShapeAttributes, 'viewBox'> & {
    viewBox?: string;
  };
  shapeContentAttributes: ShapeContentAttributes & SVGProps<T>;
  shapeType: SvgElementTypes;
  textAttributes?: SvgTextAttributes;
  children?: JSX.Element | null;
}

export enum SvgElementTypes {
  polygon,
  circle,
  rect,
  path,
}

export interface ShapeAttributes {
  fill?: SVGProps<SVGElement>['fill'];
  stroke?: SVGProps<SVGElement>['stroke'];
  width?: SVGProps<SVGElement>['width'];
  height?: SVGProps<SVGElement>['height'];
  viewBox?: ViewBoxParams;
  overflow?: SVGProps<SVGElement>['overflow'];
  preserveAspectRatio?: SVGProps<SVGElement>['preserveAspectRatio'];
}

export interface ShapeContentAttributes {
  strokeWidth?: SVGProps<SVGElement>['strokeWidth'];
  stroke?: SVGProps<SVGElement>['stroke'];
  fill?: SVGProps<SVGElement>['fill'];
  vectorEffect?: SVGProps<SVGElement>['vectorEffect'];
  strokeMiterlimit?: SVGProps<SVGElement>['strokeMiterlimit'];
}
export interface SvgConfig {
  shapeType?: SvgElementTypes;
  viewBox: ViewBoxParams;
  shapeProps:
    | SVGProps<SVGCircleElement>
    | SVGProps<SVGRectElement>
    | SVGProps<SVGPolygonElement>
    | SVGProps<SVGPathElement>;
  textAttributes?: SvgTextAttributes;
}

export interface SvgTextAttributes {
  x: SVGProps<SVGTextElement>['x'];
  y: SVGProps<SVGTextElement>['y'];
  textAnchor: SVGProps<SVGTextElement>['textAnchor'];
  dominantBaseline?: SVGProps<SVGTextElement>['dominantBaseline'];
  dx?: SVGProps<SVGTextElement>['dx'];
  dy?: SVGProps<SVGTextElement>['dy'];
}
