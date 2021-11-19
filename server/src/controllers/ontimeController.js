import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// get database
import { db, data } from '../app.js';
import {
  event as eventDef,
  delay as delayDef,
  block as blockDef,
} from '../models/eventsDefinition.js';
import { dbModel } from '../models/dataModel.js';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  let numEntries = 0;
  if ('events' in jsonData) {
    console.log('Found events definition, importing...');
    let events = [];
    let ids = [];
    for (const e of jsonData.events) {
      if (e.type === 'event') {
        // doublecheck unique ids
        if (e.id == null || ids.indexOf(e.id) !== -1) continue;
        ids.push(e.id);

        // make sure all properties exits
        // dont load any extra properties than the ones known
        events.push({
          ...eventDef,
          title: e.title,
          subtitle: e.subtitle,
          presenter: e.presenter,
          note: e.note,
          timeStart: e.timeStart,
          timeEnd: e.timeEnd,
          isPublic: e.isPublic,
          id: e.id,
        });
        numEntries++;
      } else if (e.type === 'delay') {
        events.push({ ...delayDef, duration: e.duration });
        numEntries++;
      } else if (e.type === 'block') {
        events.push({ ...blockDef });
        numEntries++;
      }
    }
    // write to db
    db.data.events = events;
    db.write();
    console.log(`Uploaded file with ${numEntries} entries`);
  }

  if ('event' in jsonData) {
    console.log('Found event data, importing...');
    const e = jsonData.event;
    // filter known properties
    const event = {
      ...dbModel.event,
      title: e.title,
      url: e.url,
      publicInfo: e.publicInfo,
      backstageInfo: e.backstageInfo,
      endMessage: e.endMessage,
    };

    // write to db
    db.data.event = event;
    db.write();
  }

  // Settings handled partially
  if ('settings' in jsonData) {
    console.log('Found settings definition, importing...');
    const s = jsonData.settings;
    let settings = {};

    if (s.oscInPort) settings.oscInPort = s.oscInPort;
    if (s.oscOutPort) settings.oscOutPort = s.oscOutPort;
    if (s.oscOutIP) settings.oscOutIP = s.oscOutIP;

    // write to db
    db.data.settings = {
      ...dbModel.settings,
      ...settings,
    };
    db.write();
  }
}

// Create controller for GET request to '/ontime/db'
// Returns -
export const dbDownload = async (req, res) => {
  const fileTitle = getEventTitle() || 'ontime events';
  const dbFile = path.resolve(__dirname, '../', 'data/db.json');

  res.download(dbFile, `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};

const upload = async (file, req, res) => {
  if (!fs.existsSync(file)) {
    res.status(500).send({ message: 'Upload failed' });
    return;
  }

  console.log(file);

  try {
    // get file
    const rawdata = fs.readFileSync(file);
    const uploadedJson = JSON.parse(rawdata);

    // delete file
    deleteFile(file);

    // check version
    if (uploadedJson.settings.version === 1) {
      try {
        parsev1(uploadedJson);
        global.timer.setupWithEventList(db.data.events);
      } catch (error) {
        res.status(400).send({ message: `Error parsing file: ${error}` });
      }
    } else {
      res.status(400).send({ message: 'Error parsing file, version unknown' });
      return;
    }

    res.sendStatus(200);
  } catch (error) {
    console.log('Error parsing file', error);
    res.status(400).send({ message: error });
  }
};

/**
 * @description Gets information on IPV4 non internal interfaces
 * @returns {array} - Array of objects {name: ip}
 */
const getNetworkInterfaces = () => {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          name: name,
          address: net.address,
        });
      }
    }
  }

  return results;
};

// Create controller for POST request to '/ontime/info'
// Returns -
export const getInfo = async (req, res) => {
  const version = data.settings.version;
  const serverPort = data.settings.serverPort;
  const oscInPort = data.settings.oscInPort;
  const oscOutPort = data.settings.oscOutPort;
  const oscOutIP = data.settings.oscOutIP;

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });

  // send object with network information
  res.status(200).send({
    networkInterfaces: ni,
    version,
    serverPort,
    oscInPort,
    oscOutPort,
    oscOutIP,
  });
};

// Create controller for POST request to '/ontime/info'
// Returns ACK message
export const postInfo = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  // TODO: validate data
  try {
    data.settings = { ...data.settings, ...req.body };
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
};

// Create controller for POST request to '/ontime/db'
// Returns -
export const dbUpload = async (req, res) => {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  const file = req.file.path;
  upload(file, req, res);
};

// Create controller for POST request to '/ontime/dbpath'
// Returns -
export const dbPathToUpload = async (req, res) => {
  if (!req.body.path) {
    res.status(400).send({ message: 'Path to file not found' });
    return;
  }
  upload(req.body.path, req, res);
};
