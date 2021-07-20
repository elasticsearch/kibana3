/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Fs from 'fs/promises';
import Path from 'path';

import { createFailError, REPO_ROOT, ToolingLog } from '@kbn/dev-utils';
import globby from 'globby';

import { KbnEnvConfigDiscovery, KbnEnvConfig } from '../../kbn_env';

const JOURNEY_PATTERN = ['**/*.journey.{ts,tsx}'];
const IGNORE_PATTERNS = ['**/node_modules/**', '**/target/**', '**/dist/**', '**/bazel-*/**'];

async function isFile(path: string) {
  try {
    const stats = await Fs.stat(path);
    return stats.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function findJourneyPaths(selectors: string[]) {
  if (!selectors.length) {
    return new Set(
      await globby(JOURNEY_PATTERN, {
        cwd: REPO_ROOT,
        absolute: true,
        onlyFiles: true,
        ignore: IGNORE_PATTERNS,
      })
    );
  }

  const paths = new Set<string>();

  for (const input of selectors) {
    // resolve relative to cwd
    const absolute = Path.resolve(input);

    // selectors pointing to files are added directly
    if (await isFile(absolute)) {
      paths.add(absolute);
      continue;
    }

    // others are treated as directories to search for journeys in
    const selectedJourneys = await globby(JOURNEY_PATTERN, {
      cwd: absolute,
      absolute: true,
      ignore: IGNORE_PATTERNS,
    });

    for (const found of selectedJourneys) {
      paths.add(found);
    }
  }

  return paths;
}

export async function loadJourneys(log: ToolingLog, selectors: string[]) {
  const discovery = new KbnEnvConfigDiscovery(log);

  const journeyPathsByEnv = new Map<KbnEnvConfig, string[]>();
  const journeysMissingEnv: string[] = [];

  for (const path of await findJourneyPaths(selectors)) {
    const env = await discovery.findForFile(path);
    if (env) {
      journeyPathsByEnv.set(env, [...(journeyPathsByEnv.get(env) ?? []), path]);
    } else {
      journeysMissingEnv.push(path);
    }
  }

  if (journeysMissingEnv.length) {
    const list = `\n  - ${journeysMissingEnv
      .map((abs) => Path.relative(process.cwd(), abs))
      .join('\n  - ')}`;

    throw createFailError(
      `Unable to find kbn.env files nearby or as parents of journey files:${list}`
    );
  }

  return journeyPathsByEnv;
}
