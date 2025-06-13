import { useEffect, useState } from 'react';

const scriptTagId = 'ontime-override';
export const useRuntimeStylesheet = (pathToFile: string | false) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!pathToFile) {
      document.getElementById(scriptTagId)?.remove();
      setShouldRender(true);
      return;
    }

    const fetchData = async () => {
      const response = await fetch(pathToFile);
      if (response.ok) {
        return response.text();
      }
      return undefined;
    };

    if (document.getElementById(scriptTagId)) {
      setShouldRender(true);
      return;
    }

    setShouldRender(false);
    const styleSheet = document.createElement('style');
    styleSheet.setAttribute('id', scriptTagId);

    fetchData()
      .then((data) => {
        if (!data) {
          console.error(`Error loading stylesheet: no data`);
          return;
        }
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
