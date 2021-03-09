/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { sortBy } from 'lodash';
import React, { FunctionComponent, useState } from 'react';
import PropTypes from 'prop-types';
import { EuiContextMenu, EuiIcon, EuiContextMenuPanelItemDescriptor } from '@elastic/eui';
import {
  PrimaryActionPopover,
  SolutionToolbarPopover,
} from '../../../../../../../src/plugins/presentation_util/public';
import { CONTEXT_MENU_TOP_BORDER_CLASSNAME } from '../../../../common/lib';
import { ComponentStrings } from '../../../../i18n/components';
import { ElementSpec } from '../../../../types';
import { flattenPanelTree } from '../../../lib/flatten_panel_tree';
import { getId } from '../../../lib/get_id';
import { ClosePopoverFn } from '../../popover';
import { AssetManager } from '../../asset_manager';
import { SavedElementsModal } from '../../saved_elements_modal';

interface CategorizedElementLists {
  [key: string]: ElementSpec[];
}

interface ElementTypeMeta {
  [key: string]: { name: string; icon: string };
}

export const { WorkpadHeaderElementMenu: strings } = ComponentStrings;

// label and icon for the context menu item for each element type
const elementTypeMeta: ElementTypeMeta = {
  chart: { name: strings.getChartMenuItemLabel(), icon: 'visArea' },
  filter: { name: strings.getFilterMenuItemLabel(), icon: 'filter' },
  image: { name: strings.getImageMenuItemLabel(), icon: 'image' },
  other: { name: strings.getOtherMenuItemLabel(), icon: 'empty' },
  progress: { name: strings.getProgressMenuItemLabel(), icon: 'visGoal' },
  shape: { name: strings.getShapeMenuItemLabel(), icon: 'node' },
  text: { name: strings.getTextMenuItemLabel(), icon: 'visText' },
};

const getElementType = (element: ElementSpec): string =>
  element && element.type && Object.keys(elementTypeMeta).includes(element.type)
    ? element.type
    : 'other';

const categorizeElementsByType = (elements: ElementSpec[]): { [key: string]: ElementSpec[] } => {
  elements = sortBy(elements, 'displayName');

  const categories: CategorizedElementLists = { other: [] };

  elements.forEach((element: ElementSpec) => {
    const type = getElementType(element);

    if (categories[type]) {
      categories[type].push(element);
    } else {
      categories[type] = [element];
    }
  });

  return categories;
};

export interface Props {
  /**
   * Dictionary of elements from elements registry
   */
  elementsRegistry: { [key: string]: ElementSpec };
  /**
   * Handler for adding a selected element to the workpad
   */
  addElement: (element: ElementSpec) => void;
}

export const ElementMenu: FunctionComponent<Props> = ({ elementsRegistry, addElement }) => {
  const [isAssetModalVisible, setAssetModalVisible] = useState(false);
  const [isSavedElementsModalVisible, setSavedElementsModalVisible] = useState(false);

  const hideAssetModal = () => setAssetModalVisible(false);
  const showAssetModal = () => setAssetModalVisible(true);
  const hideSavedElementsModal = () => setSavedElementsModalVisible(false);
  const showSavedElementsModal = () => setSavedElementsModalVisible(true);

  const {
    chart: chartElements,
    filter: filterElements,
    image: imageElements,
    other: otherElements,
    progress: progressElements,
    shape: shapeElements,
    text: textElements,
  } = categorizeElementsByType(Object.values(elementsRegistry));

  const getPanelTree = (closePopover: ClosePopoverFn) => {
    const elementToMenuItem = (element: ElementSpec): EuiContextMenuPanelItemDescriptor => ({
      name: element.displayName || element.name,
      icon: element.icon,
      onClick: () => {
        addElement(element);
        closePopover();
      },
    });

    const elementListToMenuItems = (elementList: ElementSpec[]) => {
      const type = getElementType(elementList[0]);
      const { name, icon } = elementTypeMeta[type] || elementTypeMeta.other;

      if (elementList.length > 1) {
        return {
          name,
          icon: <EuiIcon type={icon} size="m" />,
          panel: {
            id: getId('element-type'),
            title: name,
            items: elementList.map(elementToMenuItem),
          },
        };
      }

      return elementToMenuItem(elementList[0]);
    };

    return {
      id: 0,
      items: [
        elementListToMenuItems(textElements),
        elementListToMenuItems(shapeElements),
        elementListToMenuItems(chartElements),
        elementListToMenuItems(imageElements),
        elementListToMenuItems(filterElements),
        elementListToMenuItems(progressElements),
        elementListToMenuItems(otherElements),
        {
          name: strings.getMyElementsMenuItemLabel(),
          className: CONTEXT_MENU_TOP_BORDER_CLASSNAME,
          'data-test-subj': 'saved-elements-menu-option',
          icon: <EuiIcon type="empty" size="m" />,
          onClick: () => {
            showSavedElementsModal();
            closePopover();
          },
        },
        {
          name: strings.getAssetsMenuItemLabel(),
          icon: <EuiIcon type="empty" size="m" />,
          onClick: () => {
            showAssetModal();
            closePopover();
          },
        },
      ],
    };
  };

  return (
    <>
      <PrimaryActionPopover
        panelPaddingSize="none"
        label={strings.getElementMenuButtonLabel()}
        iconType="plusInCircle"
      >
        {({ closePopover }: { closePopover: ClosePopoverFn }) => (
          <EuiContextMenu
            initialPanelId={0}
            panels={flattenPanelTree(getPanelTree(closePopover))}
          />
        )}
      </PrimaryActionPopover>
      {isAssetModalVisible ? <AssetManager onClose={hideAssetModal} /> : null}
      {isSavedElementsModalVisible ? <SavedElementsModal onClose={hideSavedElementsModal} /> : null}
    </>
  );
};

ElementMenu.propTypes = {
  elementsRegistry: PropTypes.object,
  addElement: PropTypes.func.isRequired,
};
