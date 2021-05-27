import axios from 'axios';
import { ontimeURL } from './apiConstants';

export const downloadEvents = async () => {
  await axios({
    url: ontimeURL + '/db',
    method: 'GET',
    responseType: 'blob', // important
  }).then((response) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'events.json');
    document.body.appendChild(link);
    link.click();
  });
};
