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
import React from 'react';
import { EuiFieldText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { Subscription } from 'rxjs';
import { EuiButton } from '@elastic/eui';
import * as Rx from 'rxjs';
import { ISearchGeneric } from 'src/plugins/data/public';
import { Filter } from '@kbn/es-query';
import { sleep } from '@elastic/eui';
import { EqlSearchEmbeddable } from './eql_search_embeddable';
import { EQL_SEARCH_STRATEGY, IEqlSearchResponse } from '../../../common';

interface Props {
  embeddable: EqlSearchEmbeddable;
  search: ISearchGeneric;
}

interface State {
  eql?: string;
}

export class EqlInputComponent extends React.Component<Props, State> {
  private subscription?: Subscription;
  private mounted: boolean = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      eql:
        this.props.embeddable.getInput().eql ||
        `sequence with maxspan=10h
  [any where value.source.endgame.data.file_name == "*.exe"
     and user_name != "SYSTEM"] by file_path
  [process where user_name == "SYSTEM"] by process_path`,
    };
  }

  componentDidMount() {
    this.mounted = true;
    this.subscription = Rx.merge(
      this.props.embeddable.getOutput$(),
      this.props.embeddable.getInput$()
    ).subscribe(() => {
      if (this.mounted && this.props.embeddable.getInput().eql) {
        this.setState({
          eql: this.props.embeddable.getInput().eql,
        });
      }
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.mounted = false;
  }

  doQuery = () => {
    this.props
      .search({ eql: this.state.eql || '' }, {}, EQL_SEARCH_STRATEGY)
      .subscribe(async (results: IEqlSearchResponse) => {
        const filter: Filter = {
          meta: { disabled: false, negate: false, alias: '' },
          query: {
            terms: {
              _index: [results.index],
            },
          },
        };

        // const emptyPattern = await indexPatterns.make();

        // Object.assign(emptyPattern, {
        //   id: results.index,
        //   title: results.index,
        // });

        // const createdId = await emptyPattern.create();

        const indexName = results.index;
        setTimeout(() => {
          this.props.embeddable.updateInput({
            eql: this.state.eql,
            // filters: [],
            // query:
            indexPattern: indexName,
          });
        }, 1000);
      });
  };

  render() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFieldText
            fullWidth
            value={this.state.eql}
            onChange={e => this.setState({ eql: e.target.value })}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={this.doQuery}>Query</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}
