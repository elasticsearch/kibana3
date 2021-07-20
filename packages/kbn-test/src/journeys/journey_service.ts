/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { journey } from '@elastic/synthetics';

type ExtractContext<T extends typeof journey> = T extends (
  name: string,
  fn: (ctx: infer X) => any
) => any
  ? X
  : never;

export type JourneyContext = ExtractContext<typeof journey>;

export class JourneyService {
  protected readonly page: JourneyContext['page'];

  constructor(protected readonly ctx: JourneyContext) {
    this.page = ctx.page;
  }
}
