import axios from 'axios';

import { playbackURL } from './apiConstants';

/**
 * @description HTTP call to start current timer
 * @return {Promise}
 */
export const getStart = async () => axios.get(`${playbackURL}/start`);

/**
 * @description HTTP call to pause current timer
 * @return {Promise}
 */
export const getPause = async () => axios.get(`${playbackURL}/pause`);

/**
 * @description HTTP call to start roll mode
 * @return {Promise}
 */
export const getRoll = async () => axios.get(`${playbackURL}/roll`);

/**
 * @description HTTP call to skip to previous event
 * @return {Promise}
 */
export const getPrevious = async () => axios.get(`${playbackURL}/previous`);

/**
 * @description HTTP call to skip to next event
 * @return {Promise}
 */
export const getNext = async () => axios.get(`${playbackURL}/next`);

/**
 * @description HTTP call to unload current timer
 * @return {Promise}
 */
export const getUnload = async () => axios.get(`${playbackURL}/unload`);

/**
 * @description HTTP call to reload current timer
 * @return {Promise}
 */
export const getReload = async () => axios.get(`${playbackURL}/reload`);
