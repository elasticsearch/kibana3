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
import { exec, spawn } from 'child_process';
import uuid from 'uuid';
import { EQL_SEARCH_STRATEGY } from '../common';

export const eqlSearchStrategyProvider: TSearchStrategyProvider<typeof EQL_SEARCH_STRATEGY> = (
  context,
  caller
) => {
  return {
    search: request => {
      console.log('about to exec process');
      return new Promise((resolve, reject) => {
        // let child;
        // try {
        //   child = spawn(`eql query "${request.eql}" -f ../flights.jsonl`);
        // } catch (e) {
        //   console.log('error thrown,', e);
        //   reject();
        //   return;
        // }

        // child.stdout.on('data', async function(data) {
        //   console.log('stdout: ' + data);

        //   const results = data.split('\n');

        //   const tmpIndexName = `eql-tmp-${uuid.v4()}`;

        //   console.log('creating index with name ', tmpIndexName);
        //   const mappingsResponse = await caller('indices.getMapping', {
        //     index: 'kibana_sample_data_flights',
        //   });
        //   console.log('mappings response is ', mappingsResponse);
        //   const mappings = mappingsResponse.kibana_sample_data_flights.mappings;
        //   await caller('indices.create', { index: tmpIndexName });

        //   console.log('mappings is ', JSON.stringify(mappings));
        //   await caller('indices.putMapping', { index: tmpIndexName, body: mappings });

        //   await Promise.all(
        //     results.map(async result => {
        //       if (result) {
        //         //  console.log('mapping result, ', result);
        //         const doc = JSON.parse(result);
        //         //  console.log('about to index doc ', doc);
        //         await caller('index', { index: tmpIndexName, body: doc });
        //       }
        //     })
        //   );

        //   console.log('Done indexing!');
        //   resolve({ index: tmpIndexName });
        // });

        // child.stderr.on('data', function(data) {
        //   console.log('stderr: ' + data);
        // });

        // child.on('close', function(code) {
        //   console.log('child process exited with code ' + code);
        // });

        exec(
          `eql query "${request.eql}" -f ../flights.jsonl`,
          { maxBuffer: 9048 * 500 },
          async (err, stdout, stderr) => {
            if (err) {
              // node couldn't execute the command
              console.log('err is ', err);
              resolve({});
              return;
            }

            // the *entire* stdout and stderr (buffered)
            // console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            if (stdout) {
              const results = stdout.split('\n');

              const tmpIndexName = `eql-tmp-${uuid.v4()}`;

              console.log('creating index with name ', tmpIndexName);
              const mappingsResponse = await caller('indices.getMapping', {
                index: 'kibana_sample_data_flights',
              });
              console.log('mappings response is ', mappingsResponse);
              const mappings = mappingsResponse.kibana_sample_data_flights.mappings;
              await caller('indices.create', { index: tmpIndexName });

              console.log('mappings is ', JSON.stringify(mappings));
              await caller('indices.putMapping', { index: tmpIndexName, body: mappings });

              await Promise.all(
                results.map(async result => {
                  if (result) {
                    //  console.log('mapping result, ', result);
                    const doc = JSON.parse(result);
                    //  console.log('about to index doc ', doc);
                    await caller('index', { index: tmpIndexName, body: doc });
                  }
                })
              );

              console.log('Done indexing!');
              resolve({ index: tmpIndexName });
            } else {
              resolve({});
            }
          }
        );
      });
    },
  };
};
