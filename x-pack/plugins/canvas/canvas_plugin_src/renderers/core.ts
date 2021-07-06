/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { debug } from './debug';
import { markdown } from './markdown';
import { metric } from './metric';
import { pie } from './pie';
import { plot } from './plot';
import { progress } from './progress';
import { table } from './table';
import { text } from './text';

export const renderFunctions = [debug, markdown, metric, pie, plot, progress, table, text];

export const renderFunctionFactories = [];
