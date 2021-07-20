/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { journey, step } from '@elastic/synthetics';

import { DashboardService } from './services/dashboards';

journey('Large Dashboard', (ctx) => {
  const dash = new DashboardService(ctx);

  step('load savedObjects', async () => {
    await dash.initSavedObjects();
  });

  step('visit dashboard listing', async () => {
    await dash.goToListingPage();
  });
});
