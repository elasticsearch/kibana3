/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import Path from 'path';
import Fs from 'fs/promises';

import { REPO_ROOT, createFailError, ToolingLog } from '@kbn/dev-utils';
import { schema, TypeOf } from '@kbn/config-schema';

import { readConfigFile } from '../functional_test_runner/lib/config';
import {
  readKibanaConfigFromFtrConfig,
  KibanaConfig,
  KibanaConfigSchema,
} from './read_kibana_config_from_ftr_config';
import {
  readEsConfigFromFtrConfig,
  EsConfig,
  EsConfigSchema,
} from './read_es_config_from_ftr_config';

const KBN_ENV_FROM_FTR_CONFIG_CACHE = new Map<string, Promise<KbnEnvConfig>>();

const ApmConfigSchema = schema.nullable(
  schema.object({
    serverUrl: schema.uri({
      scheme: ['http', 'https'],
      defaultValue: 'https://2fad4006bf784bb8a54e52f4a5862609.apm.us-west1.gcp.cloud.es.io:443',
    }),
    secretToken: schema.string({
      defaultValue: 'Q5q5rWQEw6tKeirBpw',
    }),
    globalLabels: schema.recordOf(schema.string(), schema.string(), {
      defaultValue: {},
    }),
  })
);

export type ApmConfig = NonNullable<TypeOf<typeof ApmConfigSchema>>;

export class KbnEnvConfig {
  static async fromFtrConfig(log: ToolingLog, ftrConfigPath: string) {
    const cached = KBN_ENV_FROM_FTR_CONFIG_CACHE.get(ftrConfigPath);
    if (cached) {
      return await cached;
    }

    log.verbose(`EnvConfig: loading FTR config file at [${ftrConfigPath}]`);
    const promise = (async () => {
      const config = await readConfigFile(log, ftrConfigPath);
      return new KbnEnvConfig(
        ftrConfigPath,
        readEsConfigFromFtrConfig(config),
        readKibanaConfigFromFtrConfig(config)
      );
    })();

    KBN_ENV_FROM_FTR_CONFIG_CACHE.set(ftrConfigPath, promise);

    return await promise;
  }

  static async maybeLoad(log: ToolingLog, path: string) {
    let rootRelativeConfigPath;
    try {
      log.verbose(`EnvConfig: attempting to read kbn.env [${path}]`);
      rootRelativeConfigPath = (await Fs.readFile(path, 'utf-8')).trim();
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }

      throw error;
    }

    const ftrConfigPath = Path.resolve(REPO_ROOT, rootRelativeConfigPath);

    try {
      return await this.fromFtrConfig(log, ftrConfigPath);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        const rel = Path.relative(process.cwd(), ftrConfigPath);
        throw createFailError(
          `Unable to find FTR config file using root-relative path "${rootRelativeConfigPath}" from kbn.env file at [${rel}]`
        );
      }

      throw error;
    }
  }

  public static fromJSON(json: string) {
    let path;
    let es;
    let kibana;
    let apm;
    try {
      [path, es, kibana, apm] = JSON.parse(json);
    } catch (error) {
      throw new Error(`unable to parse kbnEnv from JSON: ${error.message}`);
    }

    if (typeof path !== 'string') {
      throw new TypeError('invalid kbnEnv from JSON: expected [path] to be a string');
    }

    return new KbnEnvConfig(
      path,
      EsConfigSchema.validate(es),
      KibanaConfigSchema.validate(kibana),
      ApmConfigSchema.validate(apm) ?? undefined
    );
  }

  public readonly id = Path.relative(REPO_ROOT, this.path);

  private constructor(
    public readonly path: string,
    public readonly es: EsConfig,
    public readonly kibana: KibanaConfig,
    public readonly apm?: ApmConfig
  ) {}

  extendForApm(labels: Record<string, string>) {
    return new KbnEnvConfig(
      this.path,
      this.es,
      this.kibana,
      ApmConfigSchema.validate({
        globalLabels: labels,
      }) ?? undefined
    );
  }

  toJSON() {
    return [this.path, this.es, this.kibana, this.apm];
  }
}
