import React, { useEffect, useState } from 'react';

import { overrideStylesURL } from '../../ontimeConfig';

const scriptTagId = 'ontime-override';
export const withStyles = (Component, pathToFile = overrideStylesURL) => {
  const ComponentWithStyles = (props) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
      const controller = new AbortController();
      const { signal } = controller;
      const fetchData = async () => {
        let response = await fetch(pathToFile, { signal });
        if (response.ok) {
          return await response.text();
        }
      };

      if (document.querySelector(`#${scriptTagId}`)) {
        setShouldRender(true);
        return;
      }

      console.log('appending')

      setShouldRender(false);
      const styleSheet = document.createElement('style');
      styleSheet.rel = 'stylesheet';
      styleSheet.setAttribute('id', 'ontime-override');

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
      return () => {
        controller.abort();
      }
    }, []);

    console.log(2, shouldRender)
    if (!shouldRender) {
      return null;
    }

    return <Component {...props} />;
  };

  ComponentWithStyles.displayName = "ComponentWithStyles";
  return ComponentWithStyles;
};
