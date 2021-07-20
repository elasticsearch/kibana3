/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { JourneyService, JourneyNavigationService, JourneyKibanaServerService } from '@kbn/test';

export class DashboardService extends JourneyService {
  private readonly nav = new JourneyNavigationService(this.ctx);
  private readonly kbn = new JourneyKibanaServerService(this.ctx);

  async initSavedObjects() {
    await this.kbn.importExport.load('src/plugins/dashboard/kbn_archives/dashboard_legacy.json');
  }

  async goToListingPage() {
    await this.nav.goToApp('dashboard');
  }
}
