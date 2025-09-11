import { defaultImportMap } from 'ontime-utils';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { changeMaxSizeOfExcel, configXlsxTemplate } from './excel.utils.js';
import { CustomFields, OntimeEntry, Rundown, TimerType, TimeStrategy } from 'ontime-types';
import { inferStrategy } from '../rundown/rundown.utils.js';

const createRow = (
  worksheet: xlsx.WorkSheet,
  config: configXlsxTemplate,
  rowIndex: number,
  entries: { [id: string]: OntimeEntry } | Rundown['entries'],
  entry: OntimeEntry,
): number => {
  if (entry.type == 'delay') return -1;

  changeMaxSizeOfExcel(worksheet, { r: rowIndex });

  if (config.id) {
    worksheet[xlsx.utils.encode_cell({ c: config.id.c, r: rowIndex })] = {
      t: 's',
      v: entry.id,
    };
  }
  worksheet[xlsx.utils.encode_cell({ c: config.title.c, r: rowIndex })] = {
    t: 's',
    v: entry.title,
  };
  worksheet[xlsx.utils.encode_cell({ c: config.colour.c, r: rowIndex })] = {
    t: 's',
    v: entry.colour,
  };
  worksheet[xlsx.utils.encode_cell({ c: config.note.c, r: rowIndex })] = {
    t: 's',
    v: entry.note,
  };

  switch (entry.type) {
    case 'event':
      const strategy = inferStrategy(entry.timeEnd, entry.duration, entry.timeStrategy);
      worksheet[xlsx.utils.encode_cell({ c: config.cue.c, r: rowIndex })] = {
        t: 's',
        v: entry.cue,
      };
      if (!entry.linkStart) {
        worksheet[xlsx.utils.encode_cell({ c: config.timeStart.c, r: rowIndex })] = {
          t: 's',
          v: entry.timeStart,
        };
      }
      if (strategy === TimeStrategy.LockEnd) {
        worksheet[xlsx.utils.encode_cell({ c: config.timeEnd.c, r: rowIndex })] = {
          t: 's',
          v: entry.timeEnd,
        };
      }
      if (strategy === TimeStrategy.LockDuration) {
        worksheet[xlsx.utils.encode_cell({ c: config.duration.c, r: rowIndex })] = {
          t: 's',
          v: entry.duration,
        };
      }
      if (config.linkStart) worksheet[xlsx.utils.encode_cell({ c: config.linkStart.c, r: rowIndex })] = {
        t: 'b',
        v: entry.linkStart,
      };
      if (config.countToEnd) worksheet[xlsx.utils.encode_cell({ c: config.countToEnd.c, r: rowIndex })] = {
        t: 'b',
        v: entry.countToEnd,
      };
      worksheet[xlsx.utils.encode_cell({ c: config.timerType.c, r: rowIndex })] = {
        t: 's',
        v: entry.timerType === TimerType.None ? TimerType.CountDown : entry.timerType,
      };
      if (config.endAction) worksheet[xlsx.utils.encode_cell({ c: config.endAction.c, r: rowIndex })] = {
        t: 's',
        v: entry.endAction,
      };
      if (config.warningTime) worksheet[xlsx.utils.encode_cell({ c: config.warningTime.c, r: rowIndex })] = {
        t: 's',
        v: entry.timeWarning,
      };
      if (config.dangerTime) worksheet[xlsx.utils.encode_cell({ c: config.dangerTime.c, r: rowIndex })] = {
        t: 's',
        v: entry.timeDanger,
      };
      if (config.skip) worksheet[xlsx.utils.encode_cell({ c: config.skip.c, r: rowIndex })] = {
        t: 'b',
        v: entry.skip,
      };
      break;
    case 'milestone':
      worksheet[xlsx.utils.encode_cell({ c: config.cue.c, r: rowIndex })] = {
        t: 's',
        v: entry.cue,
      };
      worksheet[xlsx.utils.encode_cell({ c: config.timerType.c, r: rowIndex })] = {
        t: 's',
        v: "milestone",
      };
      break;
    case 'block':
      worksheet[xlsx.utils.encode_cell({ c: config.timerType.c, r: rowIndex })] = {
        t: 's',
        v: "group-start",
      };

      entry.entries.forEach((entry, i) => {
        createRow(worksheet, config, rowIndex +i +1, entries, entries[entry]);
      })

      worksheet[xlsx.utils.encode_cell({ c: config.timerType.c, r: rowIndex +entry.entries.length +1 })] = {
        t: 's',
        v: "group-end",
      };

      return entry.entries.length + 1; // +1 for the block row itself, because block use 2 rows (block-start & block-end), and 1 is already count by for loop
  }

  return 0;
};

export const createExcel = (
  rundown: Rundown,
  customFields: CustomFields,
  options?: Partial<typeof defaultImportMap>,
): xlsx.WorkBook => {
  const workbook = xlsx.readFile(path.join(process.cwd(), 'excel', 'rundown template.xlsx'));
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const config: configXlsxTemplate<string> = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'excel', 'rundown.templateInstructor.json'), { encoding: 'utf8' }),
  );
  const configReadable = Object.fromEntries(
    Object.entries(config).map(([k, v]) => [k, xlsx.utils.decode_cell(v)]),
  ) as configXlsxTemplate;

  const customFieldsEntries = Object.entries(customFields);
  for (let i = 0; i < customFieldsEntries.length; i++) {
    worksheet[xlsx.utils.encode_cell({ c: configReadable.customFields.c + i, r: configReadable.customFields.r })] = {
      t: 's',
      v: customFieldsEntries[i][1].label,
    };
  }

  const startCol = configReadable.cue.r + 1;
  let inferSize = 0;
  for (let j = 0; j < rundown.order.length; j++) {
    const entryId = rundown.order[j];
    const entry = rundown.entries[entryId];

    inferSize += createRow(worksheet, configReadable, startCol + j + inferSize, rundown.entries, entry);
  }

  if (options) {
    Object.entries(options).forEach(([k, r]) => {
      if (k === 'custom') return;
      const pos = configReadable[k as keyof typeof configReadable];
      if (r && pos) {
        worksheet[xlsx.utils.encode_cell({ c: pos.c, r: pos.r })] = {
          t: 's',
          v: r
        };
      }
    })
  }

  return workbook;
};
