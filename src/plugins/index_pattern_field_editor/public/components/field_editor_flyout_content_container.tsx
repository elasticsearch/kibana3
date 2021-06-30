/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { DocLinksStart, NotificationsStart, CoreStart } from 'src/core/public';
import { i18n } from '@kbn/i18n';
import { METRIC_TYPE } from '@kbn/analytics';

import {
  IndexPatternField,
  IndexPattern,
  DataPublicPluginStart,
  UsageCollectionStart,
} from '../shared_imports';
import { Field, PluginStart, InternalFieldType } from '../types';
import { pluginName } from '../constants';
import { deserializeField, getRuntimeFieldValidator } from '../lib';
import { Props as FieldEditorProps } from './field_editor/field_editor';
import { FieldEditorFlyoutContent } from './field_editor_flyout_content';

export interface FieldEditorContext {
  indexPattern: IndexPattern;
  /**
   * The Kibana field type of the field to create or edit
   * Default: "runtime"
   */
  fieldTypeToProcess: InternalFieldType;
  /** The search service from the data plugin */
  search: DataPublicPluginStart['search'];
}

export interface Props {
  /**
   * Handler for the "save" footer button
   */
  onSave: (fields: IndexPatternField[]) => void;
  /**
   * Handler for the "cancel" footer button
   */
  onCancel: () => void;
  /**
   * The docLinks start service from core
   */
  docLinks: DocLinksStart;
  /**
   * The context object specific to where the editor is currently being consumed
   */
  ctx: FieldEditorContext;
  /**
   * Optional field to edit
   */
  field?: IndexPatternField;
  /**
   * Services
   */
  indexPatternService: DataPublicPluginStart['indexPatterns'];
  notifications: NotificationsStart;
  fieldFormatEditors: PluginStart['fieldFormatEditors'];
  fieldFormats: DataPublicPluginStart['fieldFormats'];
  uiSettings: CoreStart['uiSettings'];
  usageCollection: UsageCollectionStart;
}

/**
 * The container component will be in charge of the communication with the index pattern service
 * to retrieve/save the field in the saved object.
 * The <FieldEditorFlyoutContent /> component is the presentational component that won't know
 * anything about where a field comes from and where it should be persisted.
 */

export const FieldEditorFlyoutContentContainer = ({
  field,
  onSave,
  onCancel,
  docLinks,
  indexPatternService,
  ctx: { indexPattern, fieldTypeToProcess, search },
  notifications,
  fieldFormatEditors,
  fieldFormats,
  uiSettings,
  usageCollection,
}: Props) => {
  const fieldToEdit = deserializeField(indexPattern, field);
  const [Editor, setEditor] = useState<React.ComponentType<FieldEditorProps> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveRuntimeObject = useCallback(
    (updatedField: Field): IndexPatternField[] => {
      if (field?.type !== undefined && field?.type !== 'object') {
        // A previous non object runtime field is now an object
        indexPattern.removeRuntimeField(field.name);
      } else if (field?.name && field.name !== updatedField.name) {
        // rename an existing runtime object
        indexPattern.removeRuntimeObject(field.name);
      }

      // --- Temporary hack to create a runtime object ---
      const runtimeName = 'aaaObject';
      const tempRuntimeObject = {
        name: runtimeName,
        script: updatedField.script!,
        subFields: {
          field_a: updatedField,
          field_b: updatedField,
          field_c: updatedField,
        },
      };
      return indexPattern.addRuntimeObject(runtimeName, tempRuntimeObject);
      // --- end temporary hack ---
    },
    [field?.name, field?.type, indexPattern]
  );

  const saveRuntimeField = useCallback(
    (updatedField: Field): [IndexPatternField] => {
      if (field?.type !== undefined && field?.type === 'object') {
        // A previous object runtime field is now an object
        indexPattern.removeRuntimeObject(field.name);
      } else if (field?.name && field.name !== updatedField.name) {
        // rename an existing runtime field
        indexPattern.removeRuntimeField(field.name);
      }

      const fieldCreated = indexPattern.addRuntimeField(updatedField.name, updatedField);
      return [fieldCreated];
    },
    [field?.name, field?.type, indexPattern]
  );

  const saveField = useCallback(
    async (updatedField: Field) => {
      setIsSaving(true);

      if (fieldTypeToProcess === 'runtime') {
        try {
          usageCollection.reportUiCounter(pluginName, METRIC_TYPE.COUNT, 'save_runtime');
          // eslint-disable-next-line no-empty
        } catch {}
      } else {
        try {
          usageCollection.reportUiCounter(pluginName, METRIC_TYPE.COUNT, 'save_concrete');
          // eslint-disable-next-line no-empty
        } catch {}
      }

      try {
        const editedFields: IndexPatternField[] =
          // updatedField.type === 'object'
          // --> always "true" to demo the creation of runtime objects
          true ? saveRuntimeObject(updatedField) : saveRuntimeField(updatedField);

        await indexPatternService.updateSavedObject(indexPattern);

        const message = i18n.translate('indexPatternFieldEditor.deleteField.savedHeader', {
          defaultMessage: "Saved '{fieldName}'",
          values: { fieldName: updatedField.name },
        });
        notifications.toasts.addSuccess(message);

        setIsSaving(false);
        onSave(editedFields);
      } catch (e) {
        const title = i18n.translate('indexPatternFieldEditor.save.errorTitle', {
          defaultMessage: 'Failed to save field changes',
        });
        notifications.toasts.addError(e, { title });
        setIsSaving(false);
      }
    },
    [
      onSave,
      indexPattern,
      indexPatternService,
      notifications,
      fieldTypeToProcess,
      usageCollection,
      saveRuntimeField,
      saveRuntimeObject,
    ]
  );

  const validateRuntimeField = useMemo(() => getRuntimeFieldValidator(indexPattern.title, search), [
    search,
    indexPattern,
  ]);

  const loadEditor = useCallback(async () => {
    const { FieldEditor } = await import('./field_editor');

    setEditor(() => FieldEditor);
  }, []);

  useEffect(() => {
    // On mount: load the editor asynchronously
    loadEditor();
  }, [loadEditor]);

  return (
    <FieldEditorFlyoutContent
      onSave={saveField}
      onCancel={onCancel}
      docLinks={docLinks}
      field={fieldToEdit}
      FieldEditor={Editor}
      fieldFormatEditors={fieldFormatEditors}
      fieldFormats={fieldFormats}
      uiSettings={uiSettings}
      indexPattern={indexPattern}
      fieldTypeToProcess={fieldTypeToProcess}
      runtimeFieldValidator={validateRuntimeField}
      isSavingField={isSaving}
    />
  );
};
