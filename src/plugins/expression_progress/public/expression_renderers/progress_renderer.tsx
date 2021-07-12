/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { ExpressionRenderDefinition, IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { i18n } from '@kbn/i18n';
import { ProgressRendererConfig } from '../../common/types';
import { LazyProgressComponent } from '../components';
import { withSuspense } from '../../../presentation_util/public';

const ProgressComponent = withSuspense(LazyProgressComponent);

const strings = {
  getDisplayName: () =>
    i18n.translate('expressionProgress.renderer.progressVis.displayName', {
      defaultMessage: 'Progress',
    }),
  getHelpDescription: () =>
    i18n.translate('expressionProgress.renderer.progressVis.helpDescription', {
      defaultMessage: 'Render a basic progressVis',
    }),
};

export const progressVisRenderer = (): ExpressionRenderDefinition<ProgressRendererConfig> => ({
  name: 'progressVis',
  displayName: strings.getDisplayName(),
  help: strings.getHelpDescription(),
  reuseDomNode: true,
  render: async (
    domNode: HTMLElement,
    config: ProgressRendererConfig,
    handlers: IInterpreterRenderHandlers
  ) => {
    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    render(
      <ProgressComponent {...config} parentNode={domNode} onLoaded={handlers.done} />,
      domNode
    );
  },
});
