export const NODE_PORT = 4001;

const calculateServer = () => {
  return window.location.origin.replace(window.location.port, `${NODE_PORT}/`);
};

export const serverURL = calculateServer();
