import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SpreadsheetPreviewResponse, SpreadsheetWorksheetMetadata } from 'ontime-types';
import { millisToString } from 'ontime-utils';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../../../common/api/utils';
import useCustomFields from '../../../../../../common/hooks-query/useCustomFields';
import { formatDuration } from '../../../../../../common/utils/time';
import {
  type ImportFormValues,
  builtInFieldDefs,
  convertToImportMap,
  getImportWarnings,
  getPersistedImportState,
  getResolvedCustomFields,
  persistImportState,
} from './importMapUtils';
import { deriveHeaderOptionsState } from './spreadsheetImportUtils';

type ImportAction =
  | { type: 'startPreview' }
  | { type: 'startApply' }
  | { type: 'startExport' }
  | { type: 'previewSuccess'; preview: SpreadsheetPreviewResponse }
  | { type: 'applySuccess' }
  | { type: 'exportSuccess' }
  | { type: 'clearPreview'; error?: string }
  | { type: 'failure'; error: string }
  | { type: 'reset' };

type ImportState = {
  loading: '' | 'preview' | 'apply' | 'export';
  error: string;
  preview: SpreadsheetPreviewResponse | null;
};

const initialImportState: ImportState = {
  loading: '',
  error: '',
  preview: null,
};

function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'startPreview':
      return { ...state, loading: 'preview', error: '' };
    case 'startApply':
      return { ...state, loading: 'apply', error: '' };
    case 'startExport':
      return { ...state, loading: 'export', error: '' };
    case 'previewSuccess':
      return { loading: '', error: '', preview: action.preview };
    case 'applySuccess':
    case 'exportSuccess':
      return { ...state, loading: '' };
    case 'clearPreview':
      return { ...state, error: action.error ?? '', preview: null };
    case 'failure': {
      if (state.loading === 'preview') {
        return { loading: '', error: action.error, preview: null };
      }
      return { ...state, loading: '', error: action.error };
    }
    case 'reset':
      return initialImportState;
    default:
      return state;
  }
}

function getPreferredWorksheet(worksheetNames: string[], current: string, fallback: string): string {
  if (worksheetNames.includes(current)) {
    return current;
  }
  if (worksheetNames.includes(fallback)) {
    return fallback;
  }
  return worksheetNames[0] ?? '';
}

const emptyHeaders: string[] = [];

function buildColumnLabels(values: ImportFormValues): string[] {
  const builtIn: string[] = [];
  for (let i = 0; i < values.builtIn.length; i++) {
    if (values.builtIn[i].enabled) {
      builtIn.push(builtInFieldDefs[i].label);
    }
  }

  const custom: string[] = [];
  for (const { ontimeName } of getResolvedCustomFields(values.custom)) {
    if (ontimeName) {
      custom.push(ontimeName);
    }
  }

  return [...builtIn, ...custom];
}

interface UseSheetImportFormProps {
  sourceKey: string;
  worksheetNames: string[];
  initialMetadata: SpreadsheetWorksheetMetadata | null;
  loadMetadata: (worksheet: string) => Promise<SpreadsheetWorksheetMetadata>;
  previewImport: (importMap: ReturnType<typeof convertToImportMap>) => Promise<SpreadsheetPreviewResponse>;
  onApply: (preview: SpreadsheetPreviewResponse) => Promise<void>;
  onExport?: (importMap: ReturnType<typeof convertToImportMap>) => Promise<void>;
}

export function useSheetImportForm({
  sourceKey,
  worksheetNames,
  initialMetadata,
  loadMetadata,
  previewImport,
  onApply,
  onExport,
}: UseSheetImportFormProps) {
  const initialFormValues = useMemo(() => {
    const persisted = getPersistedImportState(sourceKey);
    const worksheet = getPreferredWorksheet(worksheetNames, persisted.worksheet, initialMetadata?.worksheet ?? '');
    return { ...persisted, worksheet };
  }, [initialMetadata?.worksheet, sourceKey, worksheetNames]);

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<ImportFormValues>({
    mode: 'onChange',
    defaultValues: initialFormValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'custom' });
  const values = watch();
  const { data: existingCustomFields } = useCustomFields();

  // --- Worksheet metadata via react-query ---
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['worksheet-metadata', sourceKey] });
    if (initialMetadata) {
      queryClient.setQueryData(['worksheet-metadata', sourceKey, initialMetadata.worksheet], initialMetadata);
    }
  }, [initialMetadata, sourceKey, queryClient]);

  const worksheetMetadataQuery = useQuery({
    queryKey: ['worksheet-metadata', sourceKey, values.worksheet],
    queryFn: () => loadMetadata(values.worksheet),
    enabled: Boolean(values.worksheet) && worksheetNames.includes(values.worksheet),
    staleTime: Infinity,
  });

  const headers = worksheetMetadataQuery.data?.headers ?? emptyHeaders;
  const isLoadingMetadata = worksheetMetadataQuery.isLoading;
  const metadataError = worksheetMetadataQuery.error ? maybeAxiosError(worksheetMetadataQuery.error) : '';

  // --- Derived state ---
  const { sampleHeaders, assignedHeaders } = deriveHeaderOptionsState(values, headers);
  const columnLabels = buildColumnLabels(values);

  const [state, dispatch] = useReducer(importReducer, initialImportState);
  const existingCustomFieldLabels = useMemo(
    () => Object.values(existingCustomFields).map((field) => field.label),
    [existingCustomFields],
  );
  const warnings = getImportWarnings(values, headers, existingCustomFieldLabels);
  const warningCount = Object.values(warnings).filter(Boolean).length;
  const previewRef = useRef<SpreadsheetPreviewResponse | null>(null);

  // Rehydrate the form from persisted/default state whenever the source context changes.
  useEffect(() => {
    reset(initialFormValues);
    dispatch({ type: 'reset' });
  }, [initialFormValues, reset]);

  // Keep the worksheet selection valid if the available worksheets change underneath the form.
  useEffect(() => {
    if (worksheetNames.length === 0) return;
    if (worksheetNames.includes(values.worksheet)) return;
    setValue('worksheet', worksheetNames[0], { shouldDirty: true, shouldValidate: true });
  }, [setValue, values.worksheet, worksheetNames]);

  useEffect(() => {
    previewRef.current = state.preview;
  }, [state.preview]);

  // Clear preview on any form change without re-subscribing on preview updates.
  useEffect(() => {
    const sub = watch(() => {
      if (!previewRef.current) return;
      previewRef.current = null;
      dispatch({ type: 'clearPreview' });
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // Race condition guard for async preview requests.
  const requestIdRef = useRef(0);

  const handlePreview = useCallback(
    async (formValues: ImportFormValues) => {
      const importMap = convertToImportMap(formValues);
      const id = ++requestIdRef.current;

      try {
        dispatch({ type: 'startPreview' });
        const previewData = await previewImport(importMap);

        if (requestIdRef.current !== id) return;

        dispatch({ type: 'previewSuccess', preview: previewData });
      } catch (error) {
        if (requestIdRef.current !== id) return;
        dispatch({ type: 'failure', error: maybeAxiosError(error) });
      }
    },
    [previewImport],
  );

  const handleApply = useCallback(async () => {
    if (!state.preview) return;

    try {
      dispatch({ type: 'startApply' });
      await onApply(state.preview);
      persistImportState(sourceKey, getValues());
      dispatch({ type: 'applySuccess' });
    } catch (error) {
      dispatch({ type: 'failure', error: maybeAxiosError(error) });
    }
  }, [getValues, onApply, sourceKey, state.preview]);

  const handleExport = useCallback(
    async (formValues: ImportFormValues) => {
      if (!onExport) return;
      try {
        dispatch({ type: 'startExport' });
        const importMap = convertToImportMap(formValues);
        await onExport(importMap);
        dispatch({ type: 'exportSuccess' });
      } catch (error) {
        dispatch({ type: 'failure', error: maybeAxiosError(error) });
      }
    },
    [onExport],
  );

  const isBusy = Boolean(state.loading);
  const canPreview = isValid && !isLoadingMetadata && !isBusy && worksheetNames.length > 0;
  const displayError = metadataError || state.error;
  const addCustomField = useCallback(() => {
    append({ importName: '', ontimeName: '' });
  }, [append]);

  const toolbarStatus = (() => {
    const warningText = warningCount > 0 ? ` | warnings: ${warningCount}` : '';

    if (!state.preview) {
      return `entries: – | start: – | end: – | duration: –${warningText}`;
    }

    const { flatOrder } = state.preview.rundown;
    const { start, end, duration } = state.preview.summary;
    return `entries: ${flatOrder.length} | start: ${millisToString(start)} | end: ${millisToString(end)} | duration: ${formatDuration(duration)}${warningText}`;
  })();

  return {
    values,
    setValue,
    fields,
    addCustomField,
    removeCustomField: remove,
    sampleHeaders,
    assignedHeaders,
    warnings,
    columnLabels,
    worksheetHeaders: headers,
    state,
    toolbarStatus,
    isLoadingMetadata,
    isBusy,
    canPreview,
    displayError,
    handlePreviewSubmit: handleSubmit(handlePreview),
    handleExportSubmit: handleSubmit(handleExport),
    handleApply,
  };
}
