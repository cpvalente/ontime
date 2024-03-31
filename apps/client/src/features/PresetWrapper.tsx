/* eslint-disable react/display-name */
import { ComponentType, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import useUrlPresets from '../common/hooks-query/useUrlPresets';
import { getRouteFromPreset } from '../common/utils/urlPresets';

const withPreset = <P extends object>(Component: ComponentType<P>) => {
  return (props: Partial<P>) => {
    const { data } = useUrlPresets();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // navigate if is alias route
    useEffect(() => {
      if (!data) return;
      const url = getRouteFromPreset(location, data, searchParams);
      // navigate to this route if its not empty
      if (url) {
        navigate(url);
      }
    }, [data, searchParams, navigate, location]);

    return <Component {...(props as P)} />;
  };
};

export default withPreset;
