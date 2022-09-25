import { isEmptyObject } from './parserUtils.js';

/**
 * @description initial checks for an empty of malformed request object
 * @param obj
 * @param res
 */
export const failEmptyObjects = (obj, res) => {
  let failed = false;
  try {
    if (isEmptyObject(obj)) {
      res.status(400).send('No object found in request');
      failed = true;
    }
  } catch (error) {
    res.status(400).send(error);
    failed = true;
  }
  return failed;
};
