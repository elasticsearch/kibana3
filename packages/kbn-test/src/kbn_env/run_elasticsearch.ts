/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ToolingLog } from '@kbn/dev-utils';

import { KbnEnvConfig } from './kbn_env_config';
import { createTestEsCluster } from '../es';

export async function runElasticsearch(log: ToolingLog, env: KbnEnvConfig) {
  const cluster = createTestEsCluster({
    log,
    esFrom: 'snapshot',
    license: env.es.license,
    port: env.es.port,
    ssl: env.es.isSsl,
    dataArchive: env.es.dataArchivePath,
    esArgs: env.es.configPairs,
    esJavaOpts: env.es.javaOpts,
    password: env.es.superuserPassword,
  });

  await cluster.start();

  // TODO: setup configured users/roles

  return async () => {
    await cluster.stop();
  };
}
