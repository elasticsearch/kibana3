/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FC, useState } from 'react';
import PropTypes from 'prop-types';
import { EuiContextMenu, EuiIcon } from '@elastic/eui';
import { ComponentStrings } from '../../../../i18n/components';
import { ShortcutStrings } from '../../../../i18n/shortcuts';
import { flattenPanelTree } from '../../../lib/flatten_panel_tree';
import { CustomElementModal } from '../../custom_element_modal';
import { CONTEXT_MENU_TOP_BORDER_CLASSNAME } from '../../../../common/lib/constants';
import { PositionedElement } from '../../../../types';

const { WorkpadHeaderEditMenu: strings } = ComponentStrings;
const shortcutHelp = ShortcutStrings.getShortcutHelp();

export interface Props {
  /** cuts selected elements */
  cutNodes: () => void;
  /** copies selected elements to clipboard */
  copyNodes: () => void;
  /** pastes elements stored in clipboard to page */
  pasteNodes: () => void;
  /** clones selected elements */
  cloneNodes: () => void;
  /** deletes selected elements */
  deleteNodes: () => void;
  /** moves selected element to top layer */
  bringToFront: () => void;
  /** moves selected element up one layer */
  bringForward: () => void;
  /** moves selected element down one layer */
  sendBackward: () => void;
  /** moves selected element to bottom layer */
  sendToBack: () => void;
  /** saves the selected elements as an custom-element saved object */
  createCustomElement: (name: string, description: string, image: string) => void;
  /** indicated whether the selected element is a group or not */
  groupIsSelected: boolean;
  /** only more than one selected element can be grouped */
  selectedNodes: PositionedElement[];
  /** groups selected elements */
  groupNodes: () => void;
  /** ungroups selected group */
  ungroupNodes: () => void;
  /** left align selected elements */
  alignLeft: () => void;
  /** center align selected elements */
  alignCenter: () => void;
  /** right align selected elements */
  alignRight: () => void;
  /** top align selected elements */
  alignTop: () => void;
  /** middle align selected elements */
  alignMiddle: () => void;
  /** bottom align selected elements */
  alignBottom: () => void;
  /** horizontally distribute selected elements */
  distributeHorizontally: () => void;
  /** vertically distribute selected elements */
  distributeVertically: () => void;
  /** Reverts last change to the workpad */
  undoHistory: () => void;
  /** Reapplies last reverted change to the workpad */
  redoHistory: () => void;
  /** Handler for closing the menu */
  onClose: () => void;
  /** Is there element clipboard data to paste? */
  hasPasteData: boolean;
}

export const EditMenu: FC<Props> = ({
  cutNodes,
  copyNodes,
  pasteNodes,
  deleteNodes,
  cloneNodes,
  bringToFront,
  bringForward,
  sendBackward,
  sendToBack,
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  createCustomElement,
  selectedNodes,
  groupIsSelected,
  groupNodes,
  ungroupNodes,
  undoHistory,
  redoHistory,
  onClose,
  hasPasteData,
}) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleSave = (name: string, description: string, image: string) => {
    createCustomElement(name, description, image);
    closeModal();
  };

  const getPanelTree = () => {
    const groupMenuItem = groupIsSelected
      ? {
          name: strings.getUngroupMenuItemLabel(),
          className: CONTEXT_MENU_TOP_BORDER_CLASSNAME,
          icon: <EuiIcon type="empty" size="m" />,
          onClick: () => {
            ungroupNodes();
            onClose();
          },
        }
      : {
          name: strings.getGroupMenuItemLabel(),
          className: CONTEXT_MENU_TOP_BORDER_CLASSNAME,
          icon: <EuiIcon type="empty" size="m" />,
          disabled: selectedNodes.length < 2,
          onClick: () => {
            groupNodes();
            onClose();
          },
        };

    const orderMenuItem = {
      name: strings.getOrderMenuItemLabel(),
      disabled: selectedNodes.length !== 1, // TODO: change to === 0 when we support relayering multiple elements
      icon: <EuiIcon type="empty" size="m" />,
      panel: {
        id: 1,
        title: strings.getOrderMenuItemLabel(),
        items: [
          {
            name: shortcutHelp.BRING_TO_FRONT, // TODO: check against current element position and disable if already top layer
            icon: 'sortUp',
            onClick: bringToFront,
          },
          {
            name: shortcutHelp.BRING_FORWARD, // TODO: same as above
            icon: 'arrowUp',
            onClick: bringForward,
          },
          {
            name: shortcutHelp.SEND_BACKWARD, // TODO: check against current element position and disable if already bottom layer
            icon: 'arrowDown',
            onClick: sendBackward,
          },
          {
            name: shortcutHelp.SEND_TO_BACK, // TODO: same as above
            icon: 'sortDown',
            onClick: sendToBack,
          },
        ],
      },
    };

    const alignmentMenuItem = {
      name: strings.getAlignmentMenuItemLabel(),
      className: 'canvasContextMenu',
      disabled: groupIsSelected || selectedNodes.length < 2,
      icon: <EuiIcon type="empty" size="m" />,
      panel: {
        id: 2,
        title: strings.getAlignmentMenuItemLabel(),
        items: [
          {
            name: strings.getLeftAlignMenuItemLabel(),
            icon: 'editorItemAlignLeft',
            onClick: () => {
              alignLeft();
              onClose();
            },
          },
          {
            name: strings.getCenterAlignMenuItemLabel(),
            icon: 'editorItemAlignCenter',
            onClick: () => {
              alignCenter();
              onClose();
            },
          },
          {
            name: strings.getRightAlignMenuItemLabel(),
            icon: 'editorItemAlignRight',
            onClick: () => {
              alignRight();
              onClose();
            },
          },
          {
            name: strings.getTopAlignMenuItemLabel(),
            icon: 'editorItemAlignTop',
            onClick: () => {
              alignTop();
              onClose();
            },
          },
          {
            name: strings.getMiddleAlignMenuItemLabel(),
            icon: 'editorItemAlignMiddle',
            onClick: () => {
              alignMiddle();
              onClose();
            },
          },
          {
            name: strings.getBottomAlignMenuItemLabel(),
            icon: 'editorItemAlignBottom',
            onClick: () => {
              alignBottom();
              onClose();
            },
          },
        ],
      },
    };

    const distributionMenuItem = {
      name: strings.getDistributionMenuItemLabel(),
      className: 'canvasContextMenu',
      disabled: groupIsSelected || selectedNodes.length < 3,
      icon: <EuiIcon type="empty" size="m" />,
      panel: {
        id: 3,
        title: strings.getAlignmentMenuItemLabel(),
        items: [
          {
            name: strings.getHorizontalDistributionMenuItemLabel(),
            icon: 'editorDistributeHorizontal',
            onClick: () => {
              distributeHorizontally();
              onClose();
            },
          },
          {
            name: strings.getVerticalDistributionMenuItemLabel(),
            icon: 'editorDistributeVertical',
            onClick: () => {
              distributeVertically();
              onClose();
            },
          },
        ],
      },
    };

    const savedElementMenuItem = {
      name: strings.getSaveElementMenuItemLabel(),
      icon: <EuiIcon type="indexOpen" size="m" />,
      disabled: selectedNodes.length < 1,
      className: CONTEXT_MENU_TOP_BORDER_CLASSNAME,
      'data-test-subj': 'canvasWorkpadEditMenu__saveElementButton',
      onClick: () => {
        openModal();
        onClose();
      },
    };

    const items = [
      {
        // TODO: check history and disable when there are no more changes to revert
        name: strings.getUndoMenuItemLabel(),
        icon: <EuiIcon type="editorUndo" size="m" />,
        onClick: () => {
          undoHistory();
        },
      },
      {
        // TODO: check history and disable when there are no more changes to reapply
        name: strings.getRedoMenuItemLabel(),
        icon: <EuiIcon type="editorRedo" size="m" />,
        onClick: () => {
          redoHistory();
        },
      },
      {
        name: shortcutHelp.CUT,
        icon: <EuiIcon type="cut" size="m" />,
        className: CONTEXT_MENU_TOP_BORDER_CLASSNAME,
        disabled: selectedNodes.length < 1,
        onClick: () => {
          cutNodes();
          onClose();
        },
      },
      {
        name: shortcutHelp.COPY,
        disabled: selectedNodes.length < 1,
        icon: <EuiIcon type="copy" size="m" />,
        onClick: () => {
          copyNodes();
        },
      },
      {
        name: shortcutHelp.PASTE, // TODO: can this be disabled if clipboard is empty?
        icon: <EuiIcon type="copyClipboard" size="m" />,
        disabled: !hasPasteData,
        onClick: () => {
          pasteNodes();
          onClose();
        },
      },
      {
        name: shortcutHelp.DELETE,
        icon: <EuiIcon type="trash" size="m" />,
        disabled: selectedNodes.length < 1,
        onClick: () => {
          deleteNodes();
          onClose();
        },
      },
      {
        name: shortcutHelp.CLONE,
        icon: <EuiIcon type="empty" size="m" />,
        disabled: selectedNodes.length < 1,
        onClick: () => {
          cloneNodes();
          onClose();
        },
      },
      groupMenuItem,
      orderMenuItem,
      alignmentMenuItem,
      distributionMenuItem,
      savedElementMenuItem,
    ];

    return {
      id: 0,
      // title: strings.getEditMenuLabel(),
      items,
    };
  };

  return (
    <div>
      <EuiContextMenu initialPanelId={0} panels={flattenPanelTree(getPanelTree())} />
      {isModalVisible ? (
        <CustomElementModal
          title={strings.getCreateElementModalTitle()}
          onSave={handleSave}
          onCancel={closeModal}
        />
      ) : null}
    </div>
  );
};

EditMenu.propTypes = {
  cutNodes: PropTypes.func.isRequired,
  copyNodes: PropTypes.func.isRequired,
  pasteNodes: PropTypes.func.isRequired,
  deleteNodes: PropTypes.func.isRequired,
  cloneNodes: PropTypes.func.isRequired,
  bringToFront: PropTypes.func.isRequired,
  bringForward: PropTypes.func.isRequired,
  sendBackward: PropTypes.func.isRequired,
  sendToBack: PropTypes.func.isRequired,
  alignLeft: PropTypes.func.isRequired,
  alignCenter: PropTypes.func.isRequired,
  alignRight: PropTypes.func.isRequired,
  alignTop: PropTypes.func.isRequired,
  alignMiddle: PropTypes.func.isRequired,
  alignBottom: PropTypes.func.isRequired,
  distributeHorizontally: PropTypes.func.isRequired,
  distributeVertically: PropTypes.func.isRequired,
  createCustomElement: PropTypes.func.isRequired,
  selectedNodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  groupIsSelected: PropTypes.bool.isRequired,
  groupNodes: PropTypes.func.isRequired,
  ungroupNodes: PropTypes.func.isRequired,
};
