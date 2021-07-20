/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ViewStrings } from '../../../i18n';

const { Embeddable: strings } = ViewStrings;

export const embeddable = () => ({
  name: 'embeddable',
  displayName: strings.getDisplayName(),
  // help: strings.getHelp(),
  modelArgs: [],
  requiresContext: false,
  args: [
    {
      name: 'title',
      displayName: strings.getTitleDisplayName(),
      // help: strings.getTitleHelp(),
      argType: 'string',
    },
    {
      name: 'hideTitle',
      displayName: strings.getHideTitleDisplayName(),
      // help: strings.getHideTitleHelp(),
      label: strings.getHideTitleDisplayName(),
      argType: 'toggle',
      default: false,
    },
    // {
    //   name: 'palette',
    //   displayName: strings.getPaletteDisplayName(),
    //   // help: strings.getPaletteHelp(),
    //   label: strings.getPaletteDisplayName(),
    //   argType: 'palette',
    // },
  ],
});
