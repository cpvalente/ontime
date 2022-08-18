export const useRuntimeStylesheet = (pathToFile) => {
  const fetchData = async () => {
    let response = await fetch(pathToFile);
    if (response.ok) {
      console.log(response);
      return await response.text();
    }
  };

  const styleSheet = document.createElement('style');
  styleSheet.rel = 'stylesheet';
  styleSheet.setAttribute('id', 'ontime-override');

  fetchData()
    .then((data) => {
      styleSheet.innerHTML = data;
    })
    .catch((error) => {
      console.error(`Error loading stylesheet: ${error}`);
    });

  document.head.append(styleSheet);
};
