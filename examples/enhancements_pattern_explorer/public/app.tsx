/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { EuiPageContent } from '@elastic/eui';
import { EuiFieldText } from '@elastic/eui';
import { EuiComboBox } from '@elastic/eui';
import { AppMountParameters } from 'kibana/public';

import { EuiButton } from '@elastic/eui';
import { EuiText } from '@elastic/eui';
import { EuiCode } from '@elastic/eui';
import { EuiSpacer } from '@elastic/eui';
import { EuiFlexGroup } from '@elastic/eui';
import { EuiFlexItem } from '@elastic/eui';
import { EuiFormRow } from '@elastic/eui';
import { Services } from './services';
import { Greeting } from '../../greeting/public';

function greeterToComboOption(greeter: Greeting) {
  return {
    value: greeter,
    label: greeter.label,
  };
}

function EnhancementsPatternApp(props: Services) {
  const [name, setName] = useState('');
  const greetersAsOptions = props.getGreeters().map(greeter => greeterToComboOption(greeter));
  const defaultGreeting = props.getGreeters()[0];

  const [selectedGreeter, setSelectedGreeter] = useState<Greeting | undefined>(defaultGreeting);
  return (
    <EuiPageContent>
      <EuiText>
        <h1>Enhancements pattern</h1>
        This explorer shows how one plugin can add enhancements via a{' '}
        <EuiCode>setCustomProvider</EuiCode> pattern. If you run kibana with{' '}
        <EuiCode>yarn start --run-examples</EuiCode> and click the Greet me button, you should see a
        modal. This is the enhanced functionality. If you set{' '}
        <EuiCode>greetingEnhanced.enabled: false</EuiCode> in your kibana.yml and then run this
        example again you should only see a simple alert window, the unenhanced version.
      </EuiText>
      <EuiSpacer />
      <EuiFormRow>
        <EuiFieldText
          placeholder="What is your name?"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </EuiFormRow>
      <EuiSpacer size="l" />
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow
            helpText="This functionality will use a greeter known only at runtime, so 
          all these greeters are accessed off the generic registry plugin."
          >
            <EuiFlexItem>
              <EuiComboBox<Greeting>
                selectedOptions={
                  selectedGreeter ? [greeterToComboOption(selectedGreeter)] : undefined
                }
                onChange={e => {
                  setSelectedGreeter(e[0] ? e[0].value : undefined);
                }}
                options={greetersAsOptions}
                singleSelection={{ asPlainText: true }}
              />
              <EuiButton
                disabled={selectedGreeter === undefined || name === ''}
                onClick={() => {
                  if (selectedGreeter) {
                    props.greetWithGreeter(selectedGreeter, name);
                  }
                }}
              >
                Greet me
              </EuiButton>
            </EuiFlexItem>
          </EuiFormRow>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFormRow
            helpText="This button uses a greeter type known at compile time. Prefer accessing the
           implementation directly off the plugin instead of accessing off the generic registry if possible."
          >
            <EuiButton
              disabled={selectedGreeter === undefined || name === ''}
              onClick={() => props.getCasualGreeter().greetMe(name)}
            >
              Greet me casually
            </EuiButton>
          </EuiFormRow>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiSpacer size="l" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPageContent>
  );
}

export const renderApp = (services: Services, element: AppMountParameters['element']) => {
  ReactDOM.render(<EnhancementsPatternApp {...services} />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
