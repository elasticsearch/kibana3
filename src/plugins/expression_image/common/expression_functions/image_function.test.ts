/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import expect from '@kbn/expect';
import { ExecutionContext } from 'src/plugins/expressions';
import {
  elasticLogo,
  elasticOutline,
  functionWrapper,
} from '../../../presentation_util/common/lib';
import { imageFunction as image } from './image_function';

describe('image', () => {
  const fn = functionWrapper(image);

  it('returns an image object using a dataUrl', () => {
    const result = fn(null, { dataurl: elasticOutline, mode: 'cover' }, {} as ExecutionContext);
    expect(result).to.have.property('type', 'image');
  });

  describe('args', () => {
    describe('dataurl', () => {
      it('sets the source of the image using dataurl', () => {
        const result = fn(null, { dataurl: elasticOutline }, {} as ExecutionContext);
        expect(result).to.have.property('dataurl', elasticOutline);
      });

      it.skip('sets the source of the image using url', () => {
        // This is skipped because functionWrapper doesn't use the actual
        // interpreter and doesn't resolve aliases
        const result = fn(null, { url: elasticOutline }, {} as ExecutionContext);
        expect(result).to.have.property('dataurl', elasticOutline);
      });

      it('defaults to the elasticLogo if not provided', () => {
        const result = fn(null, {}, {} as ExecutionContext);
        expect(result).to.have.property('dataurl', elasticLogo);
      });
    });

    describe('sets the mode', () => {
      it('to contain', () => {
        const result = fn(null, { mode: 'contain' }, {} as ExecutionContext);
        expect(result).to.have.property('mode', 'contain');
      });

      it('to cover', () => {
        const result = fn(null, { mode: 'cover' }, {} as ExecutionContext);
        expect(result).to.have.property('mode', 'cover');
      });

      it('to stretch', () => {
        const result = fn(null, { mode: 'stretch' }, {} as ExecutionContext);
        expect(result).to.have.property('mode', '100% 100%');
      });

      it("defaults to 'contain' if not provided", () => {
        const result = fn(null, {}, {} as ExecutionContext);
        expect(result).to.have.property('mode', 'contain');
      });
    });
  });
});
