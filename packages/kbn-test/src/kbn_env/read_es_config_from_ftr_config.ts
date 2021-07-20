/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { schema, TypeOf } from '@kbn/config-schema';
import { Config as FtrConfig } from '../functional_test_runner';

export const EsConfigSchema = schema.object({
  port: schema.number(),
  isSsl: schema.boolean(),
  license: schema.oneOf([schema.literal('basic'), schema.literal('trial')]),
  javaOpts: schema.maybe(schema.string()),
  dataArchivePath: schema.maybe(schema.string()),
  superuserPassword: schema.string(),
  configPairs: schema.arrayOf(schema.string()),
  isSecurityEnabled: schema.boolean(),
  roles: schema.mapOf(schema.string(), schema.any()),
  testUser: schema.object({
    username: schema.literal('test_user'),
    password: schema.literal('changeme'),
    roles: schema.arrayOf(schema.string()),
  }),
});

export type EsConfig = TypeOf<typeof EsConfigSchema>;

export function readEsConfigFromFtrConfig(config: FtrConfig): EsConfig {
  const port: number = config.get('servers.elasticsearch.port');
  const isSsl: boolean = !!config.get('esTestCluster.ssl');
  const license: 'basic' | 'trial' =
    config.get('esTestCluster.license') === 'basic' ? 'basic' : 'trial';
  const javaOpts: string | undefined = config.get('esTestCluster.esJavaOpts');
  const dataArchivePath: string | undefined = config.get('esTestCluster.dataArchive');
  const superuserPassword: string = config.get('servers.elasticsearch.password') ?? 'changeme';
  const configPairs: string[] = config.get('esTestCluster.serverArgs') ?? [];
  const isSecurityEnabled: boolean = configPairs.includes('xpack.security.enabled=true');
  const roles: { [name: string]: unknown } = config.get('security.roles') ?? {};

  return EsConfigSchema.validate({
    port,
    isSsl,
    license,
    javaOpts,
    dataArchivePath,
    superuserPassword,
    configPairs,
    isSecurityEnabled,
    roles,
    testUser: {
      username: 'test_user' as string,
      password: 'changeme' as string,
      roles: (config.get('security.defaultRoles') ?? []) as string[],
    },
  });
}
