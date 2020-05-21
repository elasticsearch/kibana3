/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { FC, useRef } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { debounce } from 'lodash';

import { ExpressionInput } from '../../../../components/expression_input/expression_input';
import { language, LANGUAGE_ID } from '../../../../lib/monaco_language_def';

import { getFunctions } from '../lib/functions';
import { useExpressions, useExpressionsActions } from '../hooks/use_expressions';

import './editor.scss';

export const Editor: FC = () => {
  const functionDefinitions = getFunctions();
  const { expression: value } = useExpressions();
  const { setExpression } = useExpressionsActions();

  const updateExpression = (newValue?: string) => {
    if (newValue !== value) {
      setExpression(newValue || '');
    }
  };

  const onChange = useRef(debounce(updateExpression, 500)).current;

  // TODO: I don't think this should be necessary.  Check with @poff.
  language.keywords = functionDefinitions.map(fn => fn.name);
  monaco.languages.register({ id: LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, language);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <ExpressionInput isCompact {...{ functionDefinitions, value, onChange }} />
    </div>
  );
};
