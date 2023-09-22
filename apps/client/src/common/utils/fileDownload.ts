import axios from 'axios';

import { makeCSV, makeTable } from '../../features/cuesheet/cuesheetUtils';

type FileOptions = {
  name: string;
  type: string;
};

type BlobOptions = {
  type: string;
};

export default async function fileDownload(url: string, fileOptions: FileOptions, blobOptions: BlobOptions) {
  const response = await axios({
    url: `${url}/db`,
    method: 'GET',
  });

  const headerLine = response.headers['Content-Disposition'];
  let { name: fileName } = fileOptions;
  const { type: fileType } = fileOptions;
  const { project, rundown, userFields } = response.data;

  // try and get the filename from the response
  if (headerLine != null) {
    const startFileNameIndex = headerLine.indexOf('"') + 1;
    const endFileNameIndex = headerLine.lastIndexOf('"');
    fileName = headerLine.substring(startFileNameIndex, endFileNameIndex);
  }

  let fileContent = '';

  if (fileType === 'json') {
    fileContent = JSON.stringify(response.data);
    fileName += '.json';
  }

  if (fileType === 'csv') {
    const sheetData = makeTable(project, rundown, userFields);
    fileContent = makeCSV(sheetData);
    fileName += '.csv';
  }

  const blob = new Blob([fileContent], { type: blobOptions.type });
  const downloadUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', downloadUrl);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  // Clean up the URL.createObjectURL to release resources
  URL.revokeObjectURL(downloadUrl);
  return;
}
