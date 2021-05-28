/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Component } from 'react';

import { EuiComboBox, EuiFormRow, EuiComboBoxOptionOption } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import _ from 'lodash';
import { getAnomalyJobList } from './util';

interface Props {
  onJobChange: (jobId: string) => void;
}

interface State {
  jobId?: string;
  jobIdList?: Array<EuiComboBoxOptionOption<string>>;
}

export class AnomalyJobSelector extends Component<Props, State> {
  private _isMounted: boolean = false;

  state: State = {};

  private async _loadJobs() {
    const jobList = await getAnomalyJobList();
    const options = jobList.map((j) => {
      return { label: j.jobId, value: j.jobId };
    });
    if (this._isMounted && !_.isEqual(options, this.state.jobIdList)) {
      this.setState({
        jobIdList: options,
      });
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
    this._loadJobs();
  }

  componentDidMount(): void {
    this._isMounted = true;
    this._loadJobs();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onJobIdSelect = (selectedOptions: Array<EuiComboBoxOptionOption<string>>) => {
    const jobId: string = selectedOptions[0].value!;
    if (this._isMounted) {
      this.setState({ jobId });
      this.props.onJobChange(jobId);
    }
  };

  render() {
    if (!this.state.jobIdList) {
      return null;
    }

    const options = this.state.jobId ? [{ value: this.state.jobId, label: this.state.jobId }] : [];
    return (
      <EuiFormRow
        label={i18n.translate('xpack.ml.maps.jobIdLabel', {
          defaultMessage: 'JobId',
        })}
        display="columnCompressed"
      >
        <EuiComboBox
          singleSelection={true}
          onChange={this.onJobIdSelect}
          options={this.state.jobIdList}
          selectedOptions={options}
        />
      </EuiFormRow>
    );
  }
}
