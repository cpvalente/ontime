import express from 'express';
export const router = express.Router();

// create route between controller and '/ontime/download' endpoint
router.get('/download', eventsDownload);
