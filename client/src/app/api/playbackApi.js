import axios from 'axios';
import { NODE_PORT } from '../api/apiConstants';

// get origin from URL
const serverURL = window.location.origin.replace(
  window.location.port,
  `${NODE_PORT}/`
);

export const playbackNamespace = 'playback';
const playbackURL = serverURL + playbackNamespace;

export const getStart = async () => {
  const res = await axios.get(playbackURL + '/start');
  return res;
};

export const getPause = async () => {
  const res = axios.get(playbackURL + '/pause');
  return res;
};

export const getRoll = async () => {
  const res = axios.get(playbackURL + '/roll');
  return res;
};

export const getPrevious = async () => {
  const res = axios.get(playbackURL + '/previous');
  return res;
};

export const getNext = async () => {
  const res = axios.get(playbackURL + '/next');
  return res;
};

export const getUnload = async () => {
  const res = axios.get(playbackURL + '/unload');
  return res;
};

export const getReload = async () => {
  const res = axios.get(playbackURL + '/reload');
  return res;
};
