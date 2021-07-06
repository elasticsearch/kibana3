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
import { ImageRendererConfig } from '../../common/types';

const strings = {
  getDisplayName: () =>
    i18n.translate('expressionImage.renderer.image.displayName', {
      defaultMessage: 'Image',
    }),
  getHelpDescription: () =>
    i18n.translate('expressionImage.renderer.image.helpDescription', {
      defaultMessage: 'Render a basic image',
    }),
};

const LazyImageComponent = lazy(() => import('../components/image_component'));
const ImageComponent = withSuspense(LazyImageComponent, null);

export const imageRenderer = (): ExpressionRenderDefinition<ImageRendererConfig> => ({
  name: 'image',
  displayName: strings.getDisplayName(),
  help: strings.getHelpDescription(),
  reuseDomNode: true,
  render: async (
    domNode: HTMLElement,
    config: ImageRendererConfig,
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
        <ImageComponent onLoaded={handlers.done} {...settings} parentNode={domNode} />
      </I18nProvider>,
      domNode
    );
  },
});
