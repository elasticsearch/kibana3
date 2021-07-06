/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { storiesOf } from '@storybook/react';
import { Render } from '../../../../presentation_util/public/__stories__';
import { metricRenderer } from '../metric_renderer';
import {
  elasticLogo,
  elasticOutline,
} from '../../../../../../src/plugins/presentation_util/common/lib';

storiesOf('renderers/metric', module).add('default', () => {
  const config = {
    count: 42,
    image: elasticLogo,
    size: 20,
    max: 60,
    emptyImage: elasticOutline,
  };

  return <Render renderer={metricRenderer} config={config} width="400px" />;
});
