/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { JourneyService } from '../journey_service';

interface GoToAppOptions {
  hash?: string;
}

export class JourneyNavigationService extends JourneyService {
  async goToApp(name: string, options?: GoToAppOptions) {
    const url = new URL(`http://localhost:5620/app/${name}`);

    if (options?.hash) {
      url.hash = options.hash;
    }

    await this.page.goto(url.href);
    await this.page.isVisible('.kbnAppWrapper');
  }
}
