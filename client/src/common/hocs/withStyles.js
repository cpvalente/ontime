/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react';

import { overrideStylesURL } from '../../ontimeConfig';

export const withStyles = (Component, pathToFile = overrideStylesURL) => {
  return (props) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        let response = await fetch(pathToFile);
        if (response.ok) {
          return await response.text();
        }
      };

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
          setTimeout(() => setShouldRender(true), 0);
        });
    }, []);

    if (!shouldRender) {
      return null;
    }

    return <Component {...props} />;
  };
};
