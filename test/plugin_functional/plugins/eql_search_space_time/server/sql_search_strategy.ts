/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { TSearchStrategyProvider } from 'src/plugins/data/server';
import { exec } from 'child_process';
import uuid from 'uuid';
import { SQL_SEARCH_STRATEGY } from '../common';

export const sqlSearchStrategyProvider: TSearchStrategyProvider<typeof SQL_SEARCH_STRATEGY> = (
  context,
  caller
) => {
  return {
    search: async request => {
      const results = await caller('sql', { query: request.sql });

      const tmpIndexName = `sql-tmp-${uuid.v4()}`;
      await caller('indices.create', { index: tmpIndexName });

      await Promise.all(
        results.map(async result => {
          if (result) {
            const doc = JSON.parse(result);
            await caller('index', doc);
          }
        })
      );

      return { index: tmpIndexName };
    },
  };
};
