/* eslint-disable react/display-name */
import { ComponentType, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import useUrlPresets from '../common/hooks-query/useUrlPresets';
import { getRouteFromPreset } from '../common/utils/urlPresets';

const withPreset = <P extends object>(Component: ComponentType<P>) => {
  return (props: Partial<P>) => {
    const { data } = useUrlPresets();
    const navigate = useNavigate();
    const location = useLocation();

    // navigate if is alias route
    useEffect(() => {
      if (!data) return;
      const destination = getRouteFromPreset(location, data);

      // navigate to this destination if its not null
      if (destination) {
        navigate(destination);
      }
    }, [data, navigate, location]);

    return <Component {...(props as P)} />;
  };
};

export default withPreset;
