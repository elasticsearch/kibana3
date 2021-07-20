/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { Filter, Query } from '../../../../../../../src/plugins/data/public';

import { setAbsoluteRangeDatePicker } from '../../../common/store/inputs/actions';
import { InputsModelId } from '../../../common/store/inputs/constants';
import { UpdateDateRange } from '../../../common/components/charts/common';
import { GlobalTimeArgs } from '../../../common/containers/use_global_time';
import { AlertsHistogramPanel } from '../../../detections/components/alerts_histogram_panel';
import { alertsHistogramOptions } from '../../../detections/components/alerts_histogram_panel/config';
import { useSignalIndex } from '../../../detections/containers/detection_engine/alerts/use_signal_index';
import * as i18n from '../../pages/translations';

import { useFiltersForSignalsByCategory } from './use_filters_for_signals_by_category';

interface Props extends Pick<GlobalTimeArgs, 'from' | 'to' | 'deleteQuery' | 'setQuery'> {
  combinedQueries?: string;
  filters?: Filter[];
  headerChildren?: React.ReactNode;
  /** Override all defaults, and only display this field */
  onlyField?: string;
  query?: Query;
  setAbsoluteRangeDatePickerTarget?: InputsModelId;
  timelineId?: string;
}

const SignalsByCategoryComponent: React.FC<Props> = ({
  combinedQueries,
  deleteQuery,
  filters,
  from,
  headerChildren,
  onlyField,
  query,
  setAbsoluteRangeDatePickerTarget = 'global',
  setQuery,
  timelineId,
  to,
}) => {
  const dispatch = useDispatch();
  const { signalIndexName } = useSignalIndex();
  const filtersForSignalsByCategory = useFiltersForSignalsByCategory(filters);

  const updateDateRangeCallback = useCallback<UpdateDateRange>(
    ({ x }) => {
      if (!x) {
        return;
      }
      const [min, max] = x;
      dispatch(
        setAbsoluteRangeDatePicker({
          id: setAbsoluteRangeDatePickerTarget,
          from: new Date(min).toISOString(),
          to: new Date(max).toISOString(),
        })
      );
    },
    [dispatch, setAbsoluteRangeDatePickerTarget]
  );

  return (
    <AlertsHistogramPanel
      combinedQueries={combinedQueries}
      deleteQuery={deleteQuery}
      filters={filtersForSignalsByCategory}
      from={from}
      headerChildren={headerChildren}
      onlyField={onlyField}
      query={query}
      signalIndexName={signalIndexName}
      setQuery={setQuery}
      showTotalAlertsCount={true}
      showLinkToAlerts={onlyField == null ? true : false}
      stackByOptions={onlyField == null ? alertsHistogramOptions : undefined}
      legendPosition={'right'}
      timelineId={timelineId}
      to={to}
      title={i18n.ALERT_COUNT}
      updateDateRange={updateDateRangeCallback}
    />
  );
};

SignalsByCategoryComponent.displayName = 'SignalsByCategoryComponent';

export const SignalsByCategory = React.memo(SignalsByCategoryComponent);
