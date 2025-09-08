import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { getCSSContents } from '../api/assets';
import { CSS_OVERRIDE } from '../api/constants';
import useViewSettings from '../hooks-query/useViewSettings';

const scriptTagId = 'ontime-override';

export const useRuntimeStylesheet = (): { shouldRender: boolean } => {
  const [shouldRender, setShouldRender] = useState(false);
  const { data } = useViewSettings();

  const { data: cssData } = useQuery({
    queryKey: CSS_OVERRIDE,
    queryFn: getCSSContents,
    enabled: data.overrideStyles,
    placeholderData: (previousData, _previousQuery) => previousData,
    staleTime: MILLIS_PER_HOUR,
  });

  /**
   * When a view mounts or the stylesheet path changes we need to handle potentially loading a new stylesheet
   * - if no path is given, ensure there is no stylesheet loaded
   * - if a path is given, fetch the stylesheet and inject it into the document head
   * @returns { shouldRender: boolean } - after the stylesheet is handled and the clients are ready to render
   */
  useEffect(() => {
    let styleSheet = document.getElementById(scriptTagId);

    if (!cssData || !data.overrideStyles) {
      // No stylesheet was provided, remove any existing stylesheet
      styleSheet?.remove();
      setShouldRender(true);
      return;
    }

    setShouldRender(false);

    // Ensure the stylesheet is given to the document head
    // if (!styleSheet) {
    //   styleSheet = document.createElement('style');
    //   styleSheet.setAttribute('id', scriptTagId);
    //   document.head.append(styleSheet);
    // }

    // // set style sheet content
    // styleSheet.textContent = cssData;

    // schedule render for next tick
    setTimeout(() => setShouldRender(true), 0);
  }, [cssData, data.overrideStyles]);

  return { shouldRender };
};
