/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { run, REPO_ROOT, Flags, createFlagError } from '@kbn/dev-utils';
import { schema } from '@kbn/config-schema';

import { loadJourneys } from './journey_discovery';
import { runEnv } from '../../kbn_env';

const LabelsSchema = schema.recordOf(schema.string(), schema.string());

function parseLabels(flags: Flags) {
  const json = flags['apm-labels'];
  if (!json) {
    return {};
  }

  if (typeof json !== 'string') {
    throw createFlagError('expected --apm-labels to be a JSON string');
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(json);
  } catch (error) {
    throw createFlagError(`--apm-labels is not valid JSON, parse error: ${error.message}`);
  }

  return LabelsSchema.validate(parsedJson);
}

export function runJourneysCli() {
  run(
    async ({ log, flags, procRunner }) => {
      const selectors = flags._.length ? [...flags._] : [REPO_ROOT];
      const labels = parseLabels(flags);

      if (selectors.length === 1 && selectors[0] === REPO_ROOT) {
        log.info('finding all journeys in repo');
      } else {
        log.info('finding journeys in', selectors);
      }

      const journeysByEnv = await loadJourneys(log, selectors);
      const envs = [...journeysByEnv.keys()].sort((a, b) => a.path.localeCompare(b.path));
      const journeyPaths = [...journeysByEnv.values()].flat();
      log.info('found %d journeys in %d environments', journeyPaths.length, envs.length);

      for (const baseEnv of envs) {
        const journeys = journeysByEnv.get(baseEnv)!;

        const env = baseEnv.extendForApm({
          ...labels,
          kbnJourneyEnv: baseEnv.id,
        });

        log.info('starting env', env.id);
        const teardown = await runEnv(log, procRunner, env);

        log.info('running journeys');
        log.indent(4);
        await procRunner.run('wrk', {
          cmd: process.execPath,
          args: [require.resolve('../worker/run_journey_worker'), ...journeys],
          env: {
            ...process.env,
            JOURNEY_ENV_JSON: JSON.stringify(env),
          },
          wait: true,
          cwd: REPO_ROOT,
        });
        log.indent(-4);

        await teardown();

        log.success('journeys complete');
      }
    },
    {
      usage: `node scripts/journeys [paths...]`,
      description: `
        Run one or more journeys.

          [paths...] can point to directories with "*.journey.*" files in them or point to those files directly.
      `,
      flags: {
        string: ['apm-labels'],
        help: `
          --apm-labels       JSON Record<string, string> containing labels to apply to all APM data generated during all journey executions
        `,
      },
    }
  );
}
