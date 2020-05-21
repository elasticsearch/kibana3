/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { FC } from 'react';
import { ExpressionExplorer as Component, Props } from './expression_explorer';
import { ContextProvider } from './hooks';

export const ExpressionExplorerApp: FC<Props> = ({ encodedExpression = '' }) => (
  <ContextProvider>
    <Component encodedExpression={encodedExpression} />
  </ContextProvider>
);
