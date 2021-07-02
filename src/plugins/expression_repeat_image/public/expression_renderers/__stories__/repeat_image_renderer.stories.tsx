/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { storiesOf } from '@storybook/react';
import { repeatImageRenderer as repeatImage } from '../';
import { Render } from '../../../../presentation_util/public/__stories__';
import { RepeatImage } from '../../../common/types';

storiesOf('renderers/repeatImage', module).add('default', () => {
  const config = {
    type: 'repeatImage' as 'repeatImage',
    border: '#FFEEDD',
    borderWidth: 8,
    repeatImage: RepeatImage.BOOKMARK,
    fill: '#112233',
    maintainAspect: true,
  };

  return <Render renderer={repeatImage} config={config} />;
});
