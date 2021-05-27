// get database
import { db, data } from '../app.js';
import fs from 'fs';

function getEventTitle() {
  return data.event.title;
}

async function deleteFile(file) {
  // delete a file
  fs.unlink(file, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

// parses version 1 of the data system
async function parsev1(jsonData) {
  // loop through events
  // doublecheck unique ids
  // merge to an event definition
  // merge event info
  // merge settings
}

// Create controller for GET request to '/ontime/db'
// Returns -
export const dbDownload = async (req, res) => {
  const fileTitle = getEventTitle() || 'ontime events';
  res.download('db.json', `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};

// Create controller for POST request to '/ontime/db'
// Returns -
export const dbUpload = async (req, res) => {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  const file = req.file.path;
  if (!fs.existsSync(file)) {
    res.status(500).send({ message: 'Upload failed' });
    return;
  }

  try {
    // get file
    let rawdata = fs.readFileSync(file);
    let uploadedJson = JSON.parse(rawdata);

    // delete file
    deleteFile(file);

    // check version
    if (uploadedJson.settings.version === 1) parsev1(uploadedJson);
    else {
      res.status(400).send({ message: 'Error parsing file, version unknown' });
      return;
    }

    res.sendStatus(200);
  } catch (error) {
    console.log('Error parsing file', error);
    res.status(400).send({ message: error });
  }
};
