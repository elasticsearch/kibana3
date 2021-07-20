/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { REPO_ROOT, ProcRunner } from '@kbn/dev-utils';

import { KbnEnvConfig } from './kbn_env_config';

interface Options {
  kibanaInstallDir?: string;
  extraEnvVars?: Record<string, string>;
}

export async function runKibana(procs: ProcRunner, env: KbnEnvConfig, options?: Options) {
  await procs.run('kibana', {
    cmd: env.kibana.binPath,
    args: env.kibana.cliArgs,
    env: {
      FORCE_COLOR: '1',
      ...process.env,
      ...env.kibana.extraEnvVars,
      ...(options?.extraEnvVars ?? {}),
      ...(env.apm
        ? {
            ELASTIC_APM_ACTIVE: 'true',
            ELASTIC_APM_ENVIRONMENT: process.env.CI ? 'ci' : 'development',
            ELASTIC_APM_TRANSACTION_SAMPLE_RATE: '1.0',
            ELASTIC_APM_SERVER_URL: env.apm.serverUrl,
            ELASTIC_APM_SECRET_TOKEN: env.apm.secretToken ?? undefined,
            ELASTIC_APM_GLOBAL_LABELS: Object.entries(env.apm.globalLabels)
              .map(([k, v]) => `${k}=${v}`)
              .join(','),
          }
        : {}),
    },
    cwd: options?.kibanaInstallDir || REPO_ROOT,
    wait: /Kibana is now available/,
  });

  return async () => {
    await procs.stop('kibana', 'SIGKILL');
  };
}
