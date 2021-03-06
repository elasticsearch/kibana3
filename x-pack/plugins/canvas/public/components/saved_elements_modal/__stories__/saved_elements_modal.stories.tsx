/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { waitFor } from '../../../../../../../src/plugins/presentation_util/public/__stories__';
import { SavedElementsModal } from '../saved_elements_modal.component';
import { getTestCustomElements } from './fixtures/test_elements';
import { CustomElement } from '../../../../types';

storiesOf('components/SavedElementsModal', module)
  .add('no custom elements', () => (
    <SavedElementsModal
      customElements={[] as CustomElement[]}
      search=""
      setSearch={action('setSearch')}
      onClose={action('onClose')}
      addCustomElement={action('addCustomElement')}
      findCustomElements={action('findCustomElements')}
      updateCustomElement={action('updateCustomElement')}
      removeCustomElement={action('removeCustomElement')}
    />
  ))
  .add(
    'with custom elements',
    (_, props) => (
      <SavedElementsModal
        customElements={props?.testCustomElements}
        search=""
        setSearch={action('setSearch')}
        onClose={action('onClose')}
        addCustomElement={action('addCustomElement')}
        findCustomElements={action('findCustomElements')}
        updateCustomElement={action('updateCustomElement')}
        removeCustomElement={action('removeCustomElement')}
      />
    ),
    { decorators: [waitFor(getTestCustomElements())] }
  )
  .add(
    'with text filter',
    (_, props) => (
      <SavedElementsModal
        customElements={props?.testCustomElements}
        search="Element 2"
        onClose={action('onClose')}
        setSearch={action('setSearch')}
        addCustomElement={action('addCustomElement')}
        findCustomElements={action('findCustomElements')}
        updateCustomElement={action('updateCustomElement')}
        removeCustomElement={action('removeCustomElement')}
      />
    ),
    { decorators: [waitFor(getTestCustomElements())] }
  );
