/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ToolingLog } from '@kbn/dev-utils';

import { JourneyService } from '../journey_service';
import { KbnClient } from '../../kbn_client';

export class JourneyKibanaServerService extends JourneyService {
  private kbnClient = new KbnClient({
    log: new ToolingLog({ level: 'verbose', writeTo: process.stderr }),
    url: 'http://localhost:5620',
  });

  status = this.kbnClient.status;
  plugins = this.kbnClient.plugins;
  version = this.kbnClient.version;
  savedObjects = this.kbnClient.savedObjects;
  spaces = this.kbnClient.spaces;
  uiSettings = this.kbnClient.uiSettings;
  importExport = this.kbnClient.importExport;
  request = this.kbnClient.request.bind(this.kbnClient);
  resolveUrl = this.kbnClient.resolveUrl.bind(this.kbnClient);
}
