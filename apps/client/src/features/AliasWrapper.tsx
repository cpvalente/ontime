/* eslint-disable react/display-name */
import useAliases from '../common/hooks-query/useAliases';
import { getAliasRoute } from '../common/utils/aliases';
import { ComponentType, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const withAlias = <P extends object>(Component: ComponentType<P>) => {
  return (props: Partial<P>) => {
    const { data } = useAliases();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    // navigate if is alias route
    useEffect(() => {
      if (!data) return;
      const url = getAliasRoute(location, data, searchParams);
      // navigate to this route if its not empty
      if (url) {
        navigate(url);
      }
    }, [data, searchParams, navigate, location]);

    return <Component {...props} />;
  };
};

export default withAlias;
