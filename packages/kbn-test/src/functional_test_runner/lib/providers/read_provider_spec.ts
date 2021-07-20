/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { GenericFtrService } from '../../public_types';

export type Providers = ReturnType<typeof readProviderSpec>;
export type Provider = Providers extends Array<infer X> ? X : unknown;
export type AnyProviderFn =
  | (new (...args: any[]) => GenericFtrService<any>)
  | ((...args: any[]) => any);

export function readProviderSpec(type: string, providers: Record<string, AnyProviderFn>) {
  return Object.keys(providers).map((name) => {
    return {
      type,
      name,
      fn: providers[name],
    };
  });
}
