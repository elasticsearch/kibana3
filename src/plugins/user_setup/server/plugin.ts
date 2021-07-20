/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Subscription } from 'rxjs';

import type { TypeOf } from '@kbn/config-schema';
import type { CorePreboot, Logger, PluginInitializerContext, PrebootPlugin } from 'src/core/server';

import type { ConfigSchema, ConfigType } from './config';
import { defineRoutes } from './routes';

export class UserSetupPlugin implements PrebootPlugin {
  readonly #logger: Logger;

  #configSubscription?: Subscription;
  #config?: ConfigType;
  readonly #getConfig = () => {
    if (!this.#config) {
      throw new Error('Config is not available.');
    }
    return this.#config;
  };

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.#logger = this.initializerContext.logger.get();
  }

  public setup(core: CorePreboot) {
    this.#configSubscription = this.initializerContext.config
      .create<TypeOf<typeof ConfigSchema>>()
      .subscribe((config) => {
        this.#config = config;
      });

    core.http.registerRoutes('', (router) => {
      defineRoutes({
        router,
        basePath: core.http.basePath,
        logger: this.#logger.get('routes'),
        getConfig: this.#getConfig.bind(this),
      });
    });
  }

  public stop() {
    this.#logger.debug('Stopping plugin');

    if (this.#configSubscription) {
      this.#configSubscription.unsubscribe();
      this.#configSubscription = undefined;
    }
  }
}
