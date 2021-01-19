/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

/* global jest */

import { ReactWrapper } from 'enzyme';
import enzymeToJson from 'enzyme-to-json';

const originalConsoleWarn = console.warn; // eslint-disable-line no-console
/**
 *  A dependency we're using is using deprecated react methods. Override the
 * console to hide the warnings. These should go away when we switch to
 * Elastic Charts
 */
export function disableConsoleWarning(messageToDisable: string) {
  return jest.spyOn(console, 'warn').mockImplementation((message) => {
    if (!message.startsWith(messageToDisable)) {
      originalConsoleWarn(message);
    }
  });
}

export function toJson(wrapper: ReactWrapper) {
  return enzymeToJson(wrapper, {
    noKey: true,
    mode: 'deep',
  });
}

export function mockNow(date: string | number | Date) {
  const fakeNow = new Date(date).getTime();
  return jest.spyOn(Date, 'now').mockReturnValue(fakeNow);
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
