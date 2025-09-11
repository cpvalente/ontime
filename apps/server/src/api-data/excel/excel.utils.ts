import xlsx from 'xlsx';

/**
 * the content type of the rundown.templateInstructor.json
 */
export type configXlsxTemplate<Key extends any = { [key in 'c' | 'r']: number }> = { [key in "cue" | "title" | "colour" | "timeStart" | "timeEnd" | "duration" | "note" | "timerType" | "customFields"]: Key } & { [key in "id" | "linkStart" | "countToEnd" | "endAction" | "warningTime" | "dangerTime" | "skip"]?: Key };

export const changeMaxSizeOfExcel = (
  worksheet: xlsx.WorkSheet,
  config: { [key  in "c" | "r"]?: number } = {}
): xlsx.WorkSheet =>  {
  const currentMaxSize = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const newMaxSize = {
    s: currentMaxSize.s,
    e: { c: config.c ?? currentMaxSize.e.c, r: config.r ?? currentMaxSize.e.r }
  };
  worksheet['!ref'] = xlsx.utils.encode_range(newMaxSize);
  return worksheet;
}