import { useQuery } from '@tanstack/react-query';
import { ProjectData } from 'ontime-types';

import { PROJECT_DATA } from '../api/constants';
import { getProjectData } from '../api/project';

export const initialData: ProjectData = {
  title: '',
  description: '',
  url: '',
  info: '',
  logo: null,
  custom: [],
};

export default function useProjectData() {
  const { data, isLoading } = useQuery({
    queryKey: PROJECT_DATA,
    queryFn: getProjectData,
    placeholderData: (previousData, _previousQuery) => previousData,
    initialData,
  });

  return { data, isLoading };
}
