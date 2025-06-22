import { useEffect, useState } from 'react';

const scriptTagId = 'ontime-override';

export const useRuntimeStylesheet = (pathToFile?: string): { shouldRender: boolean } => {
  const [shouldRender, setShouldRender] = useState(false);

  /**
   * When a view mounts or the stylesheet path changes we need to handle potentially loading a new stylesheet
   * - if no path is given, ensure there is no stylesheet loaded
   * - if a path is given, fetch the stylesheet and inject it into the document head
   * @returns { shouldRender: boolean } - after the stylesheet is handled and the clients are ready to render
   */
  useEffect(() => {
    if (!pathToFile) {
      handleNoStylesheet();
      return;
    }

    // there is already a stylesheet loaded, nothing further to do
    if (document.getElementById(scriptTagId)) {
      setShouldRender(true);
      return;
    }

    setShouldRender(false);

    fetchStylesheetData(pathToFile)
      .then((data: string | undefined) => {
        if (!data) {
          console.error('Error loading stylesheet: no data');
          return;
        }
        return injectStylesheet(data);
      })
      .catch((error: unknown) => {
        console.error(`Error loading stylesheet: ${error}`);
      })
      .finally(() => {
        // schedule render for next tick
        setTimeout(() => setShouldRender(true), 0);
      });

    /**
     * No stylesheet was provided, remove any existing stylesheet
     */
    function handleNoStylesheet() {
      document.getElementById(scriptTagId)?.remove();
      setShouldRender(true);
    }

    /**
     * Get data from backend
     */
    async function fetchStylesheetData(path: string) {
      const response = await fetch(path);
      if (response.ok) {
        return response.text();
      }
      return undefined;
    }

    /**
     * Add a stylesheet with given content to the document head
     */
    async function injectStylesheet(styleContent: string) {
      const styleSheet = document.createElement('style');
      styleSheet.setAttribute('id', scriptTagId);
      styleSheet.innerHTML = styleContent;
      document.head.append(styleSheet);
    }
  }, [pathToFile]);

  return { shouldRender };
};
