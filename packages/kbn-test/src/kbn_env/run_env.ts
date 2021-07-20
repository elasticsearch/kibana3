/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { ToolingLog, ProcRunner } from '@kbn/dev-utils';

import { runKibana } from './run_kibana';
import { runElasticsearch } from './run_elasticsearch';
import { KbnEnvConfig } from './kbn_env_config';

export async function runEnv(log: ToolingLog, procs: ProcRunner, env: KbnEnvConfig) {
  log.info('starting ES');
  log.indent(4);
  const teardownEs = await runElasticsearch(log, env);
  log.indent(-4);

  log.info('starting Kibana');
  log.indent(4);
  const teardownKibana = await runKibana(procs, env, {
    kibanaInstallDir: process.env.KIBANA_INSTALL_DIR,
  });
  log.indent(-4);

  return async () => {
    await teardownKibana();
    await teardownEs();
  };
}
