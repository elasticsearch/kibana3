/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { run } from '@kbn/dev-utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

run(
  async ({ flags, log }) => {
    for (const path of flags._) {
      log.info('running journey in', path);
      await sleep(5000);
    }
  },
  {
    description:
      'worker to execute the journey tests in a sub-process, which will likely wrap @elastic/synthetics in the future',
  }
);
