import { dispatchFromAdapter } from '../controllers/integrationController.js';

// There will be a full adapter here at some point
export const getApi = async (req, res) => {
  Object.entries(req.query).forEach(([k, v]) => {
    if (k === 'external') {
      dispatchFromAdapter('external', { payload: v });
    }
  });
  res.status(200).send('OK');
};
