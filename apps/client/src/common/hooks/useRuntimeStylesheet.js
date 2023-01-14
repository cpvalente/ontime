import { useEffect, useState } from 'react';

const scriptTagId = 'ontime-override';
export const useRuntimeStylesheet = (pathToFile) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(pathToFile);
      if (response.ok) {
        return response.text();
      }
    };

    if (!pathToFile) {
      document.getElementById(scriptTagId)?.remove();
      setShouldRender(true);
      return;
    }

    if (document.getElementById(scriptTagId)) {
      setShouldRender(true);
      return;
    }

    setShouldRender(false);
    const styleSheet = document.createElement('style');
    styleSheet.rel = 'stylesheet';
    styleSheet.setAttribute('id', scriptTagId);

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
