import { GoogleSpreadsheet } from 'google-spreadsheet';
import { config } from 'dotenv';
import { OntimeRundown, SyncSettings } from 'ontime-types';
import keytar from '@makepro-x/keytar';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { sendRefetch } from '../adapters/websocketAux.js';
config();

const idStart = 0x4f7b15;

const genId = (i: number) => {
  return (idStart + i * 70).toString(16).toLowerCase();
};

export async function getSheetRundownData() {
  const settings = DataProvider.getSyncSettings();
  const jwt = await keytar.getPassword('ontime', 'google');
  const doc = new GoogleSpreadsheet(settings.googleSheetId, { token: jwt });

  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  await sheet.loadCells('A1:Z1000');

  const fieldIdRow = 3;
  const fieldIdRowIndex = fieldIdRow - 1;

  type FieldTypes = {
    cue: number | string;
    subtitle: number | string;
    timeStart: Date;
    timeEnd: Date;
    duration: Date;
    presenter: string;
    title: string;
    note: string;
    colour: string;
    department: string;
    user0: string;
    user1: string;
    user2: string;
    user3: string;
    user4: string;
    user5: string;
    user6: string;
    user7: string;
    user8: string;
    user9: string;
  };

  const fieldNames = [];

  const columnCount = sheet.columnCount;
  for (let i = 0; i < columnCount; i++) {
    const cell = sheet.getCell(fieldIdRowIndex, i);
    const value = cell.value;
    fieldNames[i] = value;
  }

  const contentStartingAtRow = 5;
  const contentStartingAtRowIndex = contentStartingAtRow - 1;

  const data: FieldTypes[] = [];

  for (let i = contentStartingAtRowIndex; i < sheet.rowCount; i++) {
    const row = {} as FieldTypes;
    for (let j = 0; j < columnCount; j++) {
      const cell = sheet.getCell(i, j);
      const value = cell.value;
      const fieldName = fieldNames[j];
      const convertValue = (value: any) => {
        if (['timeStart', 'timeEnd', 'duration'].includes(fieldName)) {
          return new Date(value * 24 * 60 * 60 * 1000);
        }
        return value;
      };
      row[fieldNames[j]] = convertValue(value);
    }
    data.push(row);
  }

  console.log('data');

  return data
    .filter((i) => i.cue && i.title)
    .map((item, i) => {
      return {
        id: genId(i),
        cue: item.cue?.toString() || '',
        title: item.title,
        subtitle: item.subtitle?.toString(),
        presenter: item.presenter,
        isPublic: true,
        note: item.note,
        endAction: 'none',
        timerType: 'count-down',
        timeStart: item.timeStart.getTime(),
        timeEnd: item.timeEnd.getTime(),
        duration: item.duration.getTime(),
        skip: false,
        colour: item.colour,
        user0: item.user0,
        user1: item.user1,
        user2: item.user2,
        user3: item.user3,
        user4: item.user4,
        user5: item.user5,
        user6: item.user6,
        user7: item.user7,
        user8: item.user8,
        user9: item.user9,
        type: 'event',
        revision: 0,
      };
    }) as OntimeRundown;
}

export async function sync() {
  const settings = DataProvider.getSyncSettings();
  if (!(settings.googleSheetsEnabled && settings.googleSheetId)) {
    return;
  }
  const rundown = await getSheetRundownData();
  DataProvider.setRundown(rundown);
  sendRefetch();
}
