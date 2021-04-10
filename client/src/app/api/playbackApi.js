import { serverURL } from './apiConstants';
const playbackURL = serverURL + 'playback/';

export const getStart = async () => {
  const res = await fetch(playbackURL + 'start');
  return res;
};

export const getPause = async () => {
  const res = await fetch(playbackURL + 'pause');
  return res;
};

export const getRoll = async () => {
  const res = await fetch(playbackURL + 'roll');
  return res;
};

export const getPrevious = async () => {
  const res = await fetch(playbackURL + 'previous');
  return res;
};

export const getNext = async () => {
  const res = await fetch(playbackURL + 'next');
  return res;
};
