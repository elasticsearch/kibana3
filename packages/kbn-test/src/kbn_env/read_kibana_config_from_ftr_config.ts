/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Path from 'path';

import { schema, TypeOf } from '@kbn/config-schema';
import { REPO_ROOT } from '@kbn/dev-utils';

import { Config as FtrConfig } from '../functional_test_runner';

export const KibanaConfigSchema = schema.object({
  binPath: schema.string(),
  cliArgs: schema.arrayOf(schema.string()),
  extraEnvVars: schema.recordOf(schema.string(), schema.string()),
});

export type KibanaConfig = TypeOf<typeof KibanaConfigSchema>;

function getFlagName(arg: string) {
  if (!arg.startsWith('--')) {
    return null;
  }
  return arg.split('=')[0];
}

export function mergeKibanaCliArgs(...args: string[][]) {
  const merged: string[] = [];

  // flatten the arrays passed in and then reverse them, iterating from right to left in this list
  // allows us to skip duplicate flags that are overwritten by flags later in the list. When we find
  // a flag that is already in merged then we will prevent it from going into merged.
  for (const cliArg of args.flat().reverse()) {
    const name = getFlagName(cliArg);
    if (name === null) {
      merged.unshift(cliArg);
      continue;
    }

    const skipDuplicate =
      name !== '--plugin-path' && merged.some((mergedArg) => getFlagName(mergedArg) === name);
    if (!skipDuplicate) {
      merged.unshift(cliArg);
      continue;
    }

    // if the most recently merged arg is not named and this arg has no `=` then it's a value for this flag that we should drop
    if (!cliArg.includes('=') && getFlagName(merged[0]) === null) {
      merged.shift();
    }
  }

  return merged;
}

export function readKibanaConfigFromFtrConfig(config: FtrConfig): KibanaConfig {
  const cliArgsForBuild = config.get('kbnTestServer.buildArgs');
  const cliArgsForSource = config.get('kbnTestServer.sourceArgs');
  const defaultCliArgs = config.get('kbnTestServer.serverArgs');

  return KibanaConfigSchema.validate({
    binPath: !process.env.KIBANA_INSTALL_DIR
      ? process.execPath
      : Path.resolve(
          process.env.KIBANA_INSTALL_DIR,
          process.platform.startsWith('win') ? 'bin/kibana.bat' : 'bin/kibana'
        ),
    cliArgs: process.env.KIBANA_INSTALL_DIR
      ? mergeKibanaCliArgs(defaultCliArgs, cliArgsForBuild)
      : [
          Path.relative(process.cwd(), Path.resolve(REPO_ROOT, 'scripts/kibana')),
          ...mergeKibanaCliArgs(defaultCliArgs, cliArgsForSource),
        ],
    extraEnvVars: {},
  });
}
