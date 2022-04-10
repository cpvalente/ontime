import axios from 'axios';
import { playbackURL } from './apiConstants';

export const getStart = async () => axios.get(`${playbackURL}/start`);

export const getPause = async () => axios.get(`${playbackURL}/pause`);

export const getRoll = async () => axios.get(`${playbackURL}/roll`);

export const getPrevious = async () => axios.get(`${playbackURL}/previous`);

export const getNext = async () => axios.get(`${playbackURL}/next`);

export const getUnload = async () => axios.get(`${playbackURL}/unload`);

export const getReload = async () => axios.get(`${playbackURL}/reload`);
