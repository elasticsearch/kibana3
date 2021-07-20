/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Path from 'path';

import { REPO_ROOT, ToolingLog } from '@kbn/dev-utils';

import { KbnEnvConfig } from './kbn_env_config';

export class KbnEnvConfigDiscovery {
  private cache = new Map<string, KbnEnvConfig | null>();

  constructor(private readonly log: ToolingLog) {}

  async findForDir(path: string): Promise<KbnEnvConfig | null> {
    if (!path.startsWith(REPO_ROOT)) {
      return null;
    }

    const cached = this.cache.get(path);
    if (cached !== undefined) {
      return cached;
    }

    const config =
      (await KbnEnvConfig.maybeLoad(this.log, Path.join(path, 'kbn.env'))) ??
      (await this.findForDir(Path.dirname(path)));

    this.cache.set(path, config);
    return config;
  }

  async findForFile(path: string) {
    return await this.findForDir(Path.dirname(path));
  }
}
