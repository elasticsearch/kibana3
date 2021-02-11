/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { shouldReadFieldFromDocValues, castEsToKbnFieldTypeName } from '../plugins/data/server';

function stubbedLogstashFields() {
  return [
    //                                  |aggregatable
    //                                  |      |searchable
    // name               esType        |      |      |metadata       | subType
    ['script string', 'text', true, false, { script: "'i am a string'" }],
    ['script number', 'long', true, false, { script: '1234' }],
    ['script date', 'date', true, false, { script: '1234', lang: 'painless' }],
    ['script murmur3', 'murmur3', true, false, { script: '1234' }],
  ].map(function (row) {
    const [name, esType, aggregatable, searchable, metadata = {}, subType = undefined] = row;

    const {
      count = 0,
      script,
      lang = script ? 'expression' : undefined,
      scripted = !!script,
    } = metadata;

    // the conflict type is actually a kbnFieldType, we
    // don't have any other way to represent it here
    const type = esType === 'conflict' ? esType : castEsToKbnFieldTypeName(esType);

    return {
      name,
      type,
      esTypes: [esType],
      readFromDocValues: shouldReadFieldFromDocValues(aggregatable, esType),
      aggregatable,
      searchable,
      count,
      script,
      lang,
      scripted,
      subType,
    };
  });
}

export default stubbedLogstashFields;
