import fs from 'fs';

export const getFileListFromFolder = async (folderPath): Promise<Array<string>> => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files.map((file) => file.toString()));
      }
    });
  });
};
