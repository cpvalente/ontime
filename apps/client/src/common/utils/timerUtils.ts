export const getProjectLogoPath = (serverPort: number) => {
  // Handle non-browser environments
  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.protocol}//${window.location.hostname}:${serverPort}/data/project/logos/`;
};

// Safe fallback if we can't access the constant
export const getServerPort = () => {
  try {
    // Try to dynamically import the constant
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../api/constants').serverPort;
  } catch {
    // Fallback to default port if import fails
    return 4001;
  }
};
