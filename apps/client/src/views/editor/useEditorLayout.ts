import { isValueOfEnum } from 'ontime-utils';
import { useSearchParams } from 'react-router';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const layoutMode = getEditorLayout(searchParams.get(layoutParam));

  const setLayoutMode = (mode: EditorLayoutMode) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(layoutParam, mode);
    setSearchParams(nextParams, { replace: true });
  };

  return { layoutMode, setLayoutMode };
}
