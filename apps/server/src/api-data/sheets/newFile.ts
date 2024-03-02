import { writeToSheet } from './sheets.controller.js';
import { validateSheetOptions } from './sheets.validation.js';
import { router } from './sheets.router.js';

router.post('/sheet/:sheetId/write', validateSheetOptions, writeToSheet);
