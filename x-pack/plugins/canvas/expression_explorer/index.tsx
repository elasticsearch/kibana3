/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import 'regenerator-runtime/runtime';

import React from 'react';
import ReactDOM from 'react-dom';
import { useQueryParams, StringParam, QueryParamProvider } from 'use-query-params';

import { KibanaContextProvider } from 'src/plugins/kibana_react/public';
import { ExpressionExplorerApp } from '../public/apps/expression_explorer';

import '../../../../built_assets/css/plugins/kibana/index.light.css';
import '../public/style/index.scss';
import '@elastic/eui/dist/eui_theme_light.css';
import '@kbn/ui-framework/dist/kui_light.css';

const css = require.context(
  '../../../../built_assets/css',
  true,
  /\.\/plugins\/(?!canvas).*light\.css/
);
css.keys().forEach(filename => {
  css(filename);
});

const uiStyles = require.context(
  '../../../../src/legacy/ui/public/styles',
  false,
  /[\/\\](?!mixins|variables|_|\.|bootstrap_(light|dark))[^\/\\]+\.less/
);
uiStyles.keys().forEach(key => uiStyles(key));

const ExpressionExplorer = () => {
  const services = {
    uiSettings: new Map([['darkMode', true]]),
  };

  const [{ e }] = useQueryParams({ e: StringParam });

  return (
    <KibanaContextProvider services={services}>
      <QueryParamProvider>
        <ExpressionExplorerApp encodedExpression={e || ''} />
      </QueryParamProvider>
    </KibanaContextProvider>
  );
};

window.onload = () => {
  ReactDOM.render(<ExpressionExplorer />, document.querySelector('#container'));
};
