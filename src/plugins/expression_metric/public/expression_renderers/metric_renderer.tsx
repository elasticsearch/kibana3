/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import React, { lazy } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { I18nProvider } from '@kbn/i18n/react';
import { ExpressionRenderDefinition, IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { i18n } from '@kbn/i18n';
import { elasticOutline, isValidUrl, withSuspense } from '../../../presentation_util/public';
import { MetricRendererConfig } from '../../common/types';

const strings = {
  getDisplayName: () =>
    i18n.translate('expressionMetric.renderer.metric.displayName', {
      defaultMessage: 'Metric',
    }),
  getHelpDescription: () =>
    i18n.translate('expressionMetric.renderer.metric.helpDescription', {
      defaultMessage: 'Render a basic metric',
    }),
};

const LazyMetricComponent = lazy(() => import('../components/metric_component'));
const MetricComponent = withSuspense(LazyMetricComponent, null);

export const metricRenderer = (): ExpressionRenderDefinition<MetricRendererConfig> => ({
  name: 'metric',
  displayName: strings.getDisplayName(),
  help: strings.getHelpDescription(),
  reuseDomNode: true,
  render: async (
    domNode: HTMLElement,
    config: MetricRendererConfig,
    handlers: IInterpreterRenderHandlers
  ) => {
    const settings = {
      ...config,
      image: isValidUrl(config.image) ? config.image : elasticOutline,
      emptyImage: config.emptyImage || '',
    };

    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    render(
      <I18nProvider>
        <MetricComponent onLoaded={handlers.done} {...settings} parentNode={domNode} />
      </I18nProvider>,
      domNode
    );
  },
});
