/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  getElasticLogo,
  getElasticOutline,
  functionWrapper,
} from '../../../../../../src/plugins/presentation_util/common/lib';
import { repeatImage } from './repeat_image';

describe('repeatImage', () => {
  const fn = functionWrapper(repeatImage);

  let elasticLogo;
  let elasticOutline;
  beforeEach(async () => {
    elasticLogo = await (await getElasticLogo()).elasticLogo;
    elasticOutline = await (await getElasticOutline()).elasticOutline;
  });

  it('returns a render as repeatImage', async () => {
    const result = await fn(10);
    expect(result).toHaveProperty('type', 'render');
    expect(result).toHaveProperty('as', 'repeatImage');
  });

  describe('args', () => {
    describe('image', () => {
      it('sets the source of the repeated image', async () => {
        const result = (await fn(10, { image: elasticLogo })).value;
        expect(result).toHaveProperty('image', elasticLogo);
      });

      it('defaults to the Elastic outline logo', async () => {
        const result = (await fn(100000)).value;
        expect(result).toHaveProperty('image', elasticOutline);
      });
    });

    describe('size', () => {
      it('sets the size of the image', async () => {
        const result = (await fn(-5, { size: 200 })).value;
        expect(result).toHaveProperty('size', 200);
      });

      it('defaults to 100', async () => {
        const result = (await fn(-5)).value;
        expect(result).toHaveProperty('size', 100);
      });
    });

    describe('max', () => {
      it('sets the maximum number of a times the image is repeated', async () => {
        const result = (await fn(100000, { max: 20 })).value;
        expect(result).toHaveProperty('max', 20);
      });
      it('defaults to 1000', async () => {
        const result = (await fn(100000)).value;
        expect(result).toHaveProperty('max', 1000);
      });
    });

    describe('emptyImage', () => {
      it('returns repeatImage object with emptyImage as undefined', async () => {
        const result = (await fn(100000, { emptyImage: elasticLogo })).value;
        expect(result).toHaveProperty('emptyImage', elasticLogo);
      });
      it('sets emptyImage to null', async () => {
        const result = (await fn(100000)).value;
        expect(result).toHaveProperty('emptyImage', null);
      });
    });
  });
});
