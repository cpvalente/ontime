import { OntimeView, URLPreset } from 'ontime-types';

import { AppMode } from '../../../ontimeConfig';
import { getCuesheetColumnAccessPolicy, getCuesheetPermissionsPolicy } from '../cuesheet.policies';

describe('getCuesheetPermissionsPolicy()', () => {
  test('returns full permissions when there is no preset', () => {
    expect(getCuesheetPermissionsPolicy(undefined, true)).toEqual({
      canChangeMode: true,
      canCreateEntries: true,
      canEditEntries: true,
      canFlag: true,
      canShare: true,
    });
  });

  test('returns run-only permissions when write is disabled', () => {
    const preset: URLPreset = {
      enabled: true,
      alias: 'cuesheet-read-only',
      target: OntimeView.Cuesheet,
      search: '',
      options: {
        read: 'full',
        write: '-',
      },
    };

    expect(getCuesheetPermissionsPolicy(preset, true)).toEqual({
      canChangeMode: false,
      canCreateEntries: false,
      canEditEntries: false,
      canFlag: false,
      canShare: false,
    });
  });

  test('allows flag changes when write includes flag only', () => {
    const preset: URLPreset = {
      enabled: true,
      alias: 'cuesheet-flag',
      target: OntimeView.Cuesheet,
      search: '',
      options: {
        read: 'full',
        write: 'flag',
      },
    };

    expect(getCuesheetPermissionsPolicy(preset, true)).toEqual({
      canChangeMode: true,
      canCreateEntries: false,
      canEditEntries: false,
      canFlag: true,
      canShare: false,
    });
  });

  test('defaults to full read and write when cuesheet options are absent', () => {
    const preset: URLPreset = {
      enabled: true,
      alias: 'cuesheet-default',
      target: OntimeView.Cuesheet,
      search: '',
    };

    const policy = getCuesheetColumnAccessPolicy(preset, AppMode.Edit);

    expect(policy.canRead('title')).toBe(true);
    expect(policy.canWrite('title')).toBe(true);
  });

  test('column access honors granular permissions and mode', () => {
    const preset: URLPreset = {
      enabled: true,
      alias: 'cuesheet-granular',
      target: OntimeView.Cuesheet,
      search: '',
      options: {
        read: 'cue,title',
        write: 'title',
      },
    };

    const editPolicy = getCuesheetColumnAccessPolicy(preset, AppMode.Edit);
    const runPolicy = getCuesheetColumnAccessPolicy(preset, AppMode.Run);

    expect(editPolicy.canRead('cue')).toBe(true);
    expect(editPolicy.canRead('duration')).toBe(false);
    expect(editPolicy.canWrite('title')).toBe(true);
    expect(editPolicy.canWrite('cue')).toBe(false);
    expect(runPolicy.canWrite('title')).toBe(false);
  });
});
