type ValidationStatus = {
  errors: string[];
  isValid: boolean;
};

export function validateFile(file: File): ValidationStatus {
  const status: ValidationStatus = { errors: [], isValid: true };
  if (!file) {
    status.errors.push('No file to upload');
    status.isValid = false;
  }

  // Limit file size to 1MB
  if (file.size > 1000000) {
    status.errors.push('File size limit (1MB) exceeded');
    status.isValid = false;
  }

  // Check file extension
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.json')) {
    status.errors.push('Unhandled file type');
    status.isValid = false;
  }
  return status;
}

export type MaybeFile = null | 'ontime' | 'excel';

export function isExcelFile(file: File | null) {
  return file?.name.endsWith('.xlsx');
}

export function isOntimeFile(file: File | null) {
  return file?.name.endsWith('.json');
}

export type ExcelImportMapKeys = keyof typeof defaultExcelImportMap;

export const defaultExcelImportMap = {
  worksheet: 'ontime',
  projectName: 'project name',
  projectDescription: 'project description',
  publicUrl: 'public url',
  publicInfo: 'public info',
  backstageUrl: 'backstage url',
  backstageInfo: 'backstage info',
  timeStart: 'start',
  timeEnd: 'end',
  duration: 'duration',
  cue: 'cue',
  title: 'title',
  presenter: 'presenter',
  subtitle: 'subtitle',
  isPublic: 'public',
  skip: 'skip',
  note: 'note',
  colour: 'colour',
  endAction: 'end action',
  timerType: 'timer type',
  user0: 'user0',
  user1: 'user1',
  user2: 'user2',
  user3: 'user3',
  user4: 'user4',
  user5: 'user5',
  user6: 'user6',
  user7: 'user7',
  user8: 'user8',
  user9: 'user9',
};
