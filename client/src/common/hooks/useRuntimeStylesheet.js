import { useEffect, useState } from 'react';

import { overrideStylesURL } from '../../ontimeConfig';

const scriptTagId = 'ontime-override';
export const useRuntimeStylesheet = (pathToFile = overrideStylesURL) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      let response = await fetch(pathToFile);
      if (response.ok) {
        return await response.text();
      }
    };

    if (document.querySelector(`#${scriptTagId}`)) {
      return;
    }

    setShouldRender(false);
    const styleSheet = document.createElement('style');
    styleSheet.rel = 'stylesheet';
    styleSheet.setAttribute('id', '');

    fetchData()
      .then((data) => {
        styleSheet.innerHTML = data;
        document.head.append(styleSheet);
      })
      .catch((error) => {
        console.error(`Error loading stylesheet: ${error}`);
      })
      .finally(() => {
        // schedule render for next tick
        setTimeout(() => setShouldRender(true), 0);
      });
  }, [pathToFile]);

  return { shouldRender };
};
