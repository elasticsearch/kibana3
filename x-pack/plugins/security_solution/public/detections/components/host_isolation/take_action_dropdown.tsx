/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EuiContextMenu, EuiButton, EuiPopover } from '@elastic/eui';
import { noop } from 'lodash';
import { ISOLATE_HOST, UNISOLATE_HOST, CHANGE_ALERT_STATUS } from './translations';
import { TAKE_ACTION } from '../alerts_table/alerts_utility_bar/translations';
import { useHostIsolationStatus } from '../../containers/detection_engine/alerts/use_host_isolation_status';
import { HostStatus } from '../../../../common/endpoint/types';
import { useIsolationPrivileges } from '../../../common/hooks/endpoint/use_isolate_privileges';

import { getEventType } from '../../../timelines/components/timeline/body/helpers';
import { TimelineNonEcsData } from '../../../../common';
import { Ecs } from '../../../../common/ecs';
import { useExceptionModal } from '../alerts_table/timeline_actions/use_add_exception_modal';
import { useAlertsActions } from '../alerts_table/timeline_actions/use_alerts_actions.ts';
import { AddExceptionModalWrapper } from '../alerts_table/timeline_actions/alert_context_menu';
import { EventFiltersModal } from '../../../management/pages/event_filters/view/components/modal';
import { useInvestigateInTimeline } from '../alerts_table/timeline_actions/use_investigate_in_timeline';
import {
  ACTION_ADD_ENDPOINT_EXCEPTION,
  ACTION_ADD_EVENT_FILTER,
  ACTION_ADD_EXCEPTION,
  ACTION_INVESTIGATE_IN_TIMELINE,
} from '../alerts_table/translations';

export const TakeActionDropdown = React.memo(
  ({
    onChange,
    agentId,
    eventId,
    ecsData,
    nonEcsData,
    isAlert,
    isEndpointAlert,
    isolationSupported,
    isHostIsolationPanelOpen,
    loadingEventDetails,
    timelineId,
    refetch,
    handleOnEventClosed,
  }: {
    onChange: (action: 'isolateHost' | 'unisolateHost') => void;
    agentId: string;
    eventId: string;
    ecsData?: Ecs;
    nonEcsData?: TimelineNonEcsData[];
    isAlert: boolean;
    isEndpointAlert: boolean;
    isolationSupported: boolean;
    isHostIsolationPanelOpen: boolean;
    loadingEventDetails: boolean;
    timelineId: string;
    refetch: (() => void) | undefined;
    handleOnEventClosed: () => void;
  }) => {
    const { loading, isIsolated: isolationStatus, agentStatus } = useHostIsolationStatus({
      agentId,
    });

    const { isAllowed: isIsolationAllowed } = useIsolationPrivileges();

    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isAddEventFilterModalOpen, setIsAddEventFilterModalOpen] = useState<boolean>(false);

    const closeAddEventFilterModal = useCallback((): void => {
      setIsAddEventFilterModalOpen(false);
    }, []);

    const togglePopoverHandler = useCallback(() => {
      setIsPopoverOpen(!isPopoverOpen);
    }, [isPopoverOpen]);

    const closePopoverHandler = useCallback(() => {
      setIsPopoverOpen(false);
    }, []);

    const closePopOverAndFlyout = useCallback(() => {
      closePopoverHandler();
      handleOnEventClosed();
    }, [closePopoverHandler, handleOnEventClosed]);

    const isolateHostHandler = useCallback(() => {
      setIsPopoverOpen(false);
      if (isolationStatus === false) {
        onChange('isolateHost');
      } else {
        onChange('unisolateHost');
      }
    }, [onChange, isolationStatus]);

    const isolateHostKey = isolationStatus === false ? 'isolateHost' : 'unisolateHost';
    const isolateHostTitle = isolationStatus === false ? ISOLATE_HOST : UNISOLATE_HOST;
    const eventType = ecsData != null ? getEventType(ecsData) : null;

    const {
      exceptionModalType,
      ruleId,
      ruleName,
      ruleIndices,
      alertStatus,
      handleOpenExceptionModal,
      onAddExceptionCancel,
      onAddExceptionConfirm,
    } = useExceptionModal({
      ecsRowData: ecsData!,
      refetch: refetch ?? noop,
      timelineId,
    });

    const {
      showStatusFilter,
      statusFiltersActions,
      handleAddEventFilterClick,
      handleAddExceptionClick,
      handleAddEndpointExceptionClick,
    } = useAlertsActions({
      ecsRowData: ecsData!,
      timelineId,
      closePopover: closePopOverAndFlyout,
      handleOpenExceptionModal,
      openAddEventFilterModal: noop,
    });

    const { handleInvestigateInTimelineAlertClick } = useInvestigateInTimeline({
      ecsRowData: ecsData ?? null,
      nonEcsRowData: nonEcsData ?? [],
    });

    const panels = useMemo(
      () => [
        {
          id: 0,
          items: [
            ...(showStatusFilter
              ? [
                  {
                    name: CHANGE_ALERT_STATUS,
                    panel: 1,
                  },
                  {
                    name: ACTION_ADD_ENDPOINT_EXCEPTION,
                    onClick: handleAddEndpointExceptionClick,
                  },
                  {
                    name: ACTION_ADD_EXCEPTION,
                    onClick: handleAddExceptionClick,
                  },
                ]
              : [
                  {
                    name: ACTION_ADD_EVENT_FILTER,
                    onClick: handleAddEventFilterClick,
                  },
                ]),
            // ...(ecsData != null
            //   ? [<AddToCaseAction key="attach-to-case" ecsRowData={ecsData} type="text" />]
            //   : []),
            ...(isIsolationAllowed &&
            isEndpointAlert &&
            isolationSupported &&
            isHostIsolationPanelOpen === false
              ? [
                  {
                    name: isolateHostTitle,
                    onClick: isolateHostHandler,
                    disabled: loading || agentStatus === HostStatus.UNENROLLED,
                  },
                ]
              : []),
            ...(eventType === 'signal' && ecsData != null
              ? [
                  {
                    name: ACTION_INVESTIGATE_IN_TIMELINE,
                    onClick: handleInvestigateInTimelineAlertClick,
                  },
                ]
              : []),
          ],
        },
        {
          id: 1,
          title: CHANGE_ALERT_STATUS,
          items: [...(showStatusFilter ? statusFiltersActions : [])],
        },
      ],
      [
        agentStatus,
        ecsData,
        eventType,
        handleAddEndpointExceptionClick,
        handleAddEventFilterClick,
        handleAddExceptionClick,
        handleInvestigateInTimelineAlertClick,
        isEndpointAlert,
        isHostIsolationPanelOpen,
        isIsolationAllowed,
        isolateHostHandler,
        isolateHostTitle,
        isolationSupported,
        loading,
        showStatusFilter,
        statusFiltersActions,
      ]
    );

    const takeActionButton = useMemo(() => {
      return (
        <EuiButton iconSide="right" fill iconType="arrowDown" onClick={togglePopoverHandler}>
          {TAKE_ACTION}
        </EuiButton>
      );
    }, [togglePopoverHandler]);

    return panels[0].items.length > 0 && !loadingEventDetails ? (
      <>
        <EuiPopover
          id="hostIsolationTakeActionPanel"
          button={takeActionButton}
          isOpen={isPopoverOpen}
          closePopover={closePopoverHandler}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenu size="s" initialPanelId={0} panels={panels} />
        </EuiPopover>
        {exceptionModalType != null && ruleId != null && ecsData != null && (
          <AddExceptionModalWrapper
            ruleName={ruleName}
            ruleId={ruleId}
            ruleIndices={ruleIndices}
            exceptionListType={exceptionModalType}
            ecsData={ecsData}
            onCancel={onAddExceptionCancel}
            onConfirm={onAddExceptionConfirm}
            alertStatus={alertStatus}
          />
        )}
        {isAddEventFilterModalOpen && ecsData != null && (
          <EventFiltersModal data={ecsData} onCancel={closeAddEventFilterModal} />
        )}
      </>
    ) : null;
  }
);

TakeActionDropdown.displayName = 'TakeActionDropdown';
