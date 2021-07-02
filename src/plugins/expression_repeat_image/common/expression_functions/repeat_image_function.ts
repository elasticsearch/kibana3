/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { i18n } from '@kbn/i18n';
import { ExpressionRepeatImageFunction, RepeatImage } from '../types';
import { SVG } from '../constants';

export const strings = {
  help: i18n.translate('expressionRepeatImage.functions.repeatImageHelpText', {
    defaultMessage: 'Creates a repeatImage.',
  }),
  args: {
    repeatImage: i18n.translate(
      'expressionRepeatImage.functions.repeatImage.args.repeatImageHelpText',
      {
        defaultMessage: 'Pick a repeatImage.',
      }
    ),
    border: i18n.translate('expressionRepeatImage.functions.repeatImage.args.borderHelpText', {
      defaultMessage: 'An {SVG} color for the border outlining the repeatImage.',
      values: {
        SVG,
      },
    }),
    borderWidth: i18n.translate(
      'expressionRepeatImage.functions.repeatImage.args.borderWidthHelpText',
      {
        defaultMessage: 'The thickness of the border.',
      }
    ),
    fill: i18n.translate('expressionRepeatImage.functions.repeatImage.args.fillHelpText', {
      defaultMessage: 'An {SVG} color to fill the repeatImage.',
      values: {
        SVG,
      },
    }),
    maintainAspect: i18n.translate(
      'expressionRepeatImage.functions.repeatImage.args.maintainAspectHelpText',
      {
        defaultMessage: `Maintain the repeatImage's original aspect ratio?`,
      }
    ),
  },
};

export const repeatImageFunction: ExpressionRepeatImageFunction = () => {
  const { help, args: argHelp } = strings;

  return {
    name: 'repeatImage',
    aliases: [],
    inputTypes: ['null'],
    help,
    args: {
      repeatImage: {
        types: ['string'],
        help: argHelp.repeatImage,
        aliases: ['_'],
        default: 'square',
        options: Object.values(RepeatImage),
      },
      border: {
        types: ['string'],
        aliases: ['stroke'],
        help: argHelp.border,
      },
      borderWidth: {
        types: ['number'],
        aliases: ['strokeWidth'],
        help: argHelp.borderWidth,
        default: 0,
      },
      fill: {
        types: ['string'],
        help: argHelp.fill,
        default: 'black',
      },
      maintainAspect: {
        types: ['boolean'],
        help: argHelp.maintainAspect,
        default: false,
        options: [true, false],
      },
    },
    fn: (input, args) => ({
      type: 'repeatImage',
      ...args,
    }),
  };
};
