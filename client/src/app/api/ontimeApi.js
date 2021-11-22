import axios from 'axios';
import { ontimeURL } from './apiConstants';

export const ontimePlaceholderInfo = {
  networkInterfaces: [],
  version: '',
  serverPort: 4001,
  oscInPort: '',
  oscOutPort: '',
  oscOutIP: '',
};

export const getInfo = async () => {
  const res = await axios.get(ontimeURL + '/info');
  return res.data;
};

export const postInfo = async (data) => {
  const res = await axios.post(ontimeURL + '/info', data);
  return res;
};

export const downloadEvents = async () => {
  await axios({
    url: ontimeURL + '/db',
    method: 'GET',
    responseType: 'blob', // important
  }).then((response) => {
    let headerLine = response.headers['Content-Disposition'];
    let filename = 'events.json';

    // try and get the filename from the response
    if (headerLine != null) {
      let startFileNameIndex = headerLine.indexOf('"') + 1;
      let endFileNameIndex = headerLine.lastIndexOf('"');
      filename = headerLine.substring(startFileNameIndex, endFileNameIndex);
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
  });
};

export const uploadEvents = async (file) => {
  const formData = new FormData();
  formData.append('userFile', file); // appending file
  await axios
    .post(ontimeURL + '/db', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => console.log(res.data))
    .catch((err) => console.error(err));
};

export const uploadEventsWithPath = async (filepath) => {
  await axios.post(ontimeURL + '/dbpath', { path: filepath });
};
