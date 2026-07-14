import { isValueOfEnum } from 'ontime-utils';
import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';

import { setSelectRundownInParams } from '../../common/context/RundownSelectionContext';

const layoutParam = 'layout';

export enum EditorLayoutMode {
  CONTROL = 'control',
  PLANNING = 'planning',
  TRACKING = 'tracking',
}

/**
 * Resolves the current editor layout mode from a nullable string value
 */
function getEditorLayout(value: string | null): EditorLayoutMode {
  if (isValueOfEnum(EditorLayoutMode, value)) {
    return value;
  }
  return EditorLayoutMode.CONTROL;
}

export function useEditorLayout() {
  'use memo';

  const [searchParams, setSearchParams] = useSearchParams();
  const layoutMode = getEditorLayout(searchParams.get(layoutParam));

  useEffect(() => {
    setSearchParams((searchParams) => {
      if (layoutMode !== EditorLayoutMode.PLANNING) setSelectRundownInParams(null, searchParams);
      return searchParams;
    });
  }, [setSearchParams, layoutMode]);

  const setLayoutMode = useCallback(
    (mode: EditorLayoutMode) => {
      setSearchParams((searchParams) => {
        searchParams.set(layoutParam, mode);
        // Only the Planning layout is allowed to look at something other than the current rundown
        if (mode !== EditorLayoutMode.PLANNING) setSelectRundownInParams(null, searchParams);
        return searchParams;
      });
    },
    [setSearchParams],
  );

  return { layoutMode, setLayoutMode };
}
