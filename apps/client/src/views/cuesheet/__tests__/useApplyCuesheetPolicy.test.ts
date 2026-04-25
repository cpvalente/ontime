import { describe, expect, it } from 'vitest';

import { AppMode } from '../../../ontimeConfig';
import { getEffectiveCuesheetMode } from '../useApplyCuesheetPolicy';

describe('getEffectiveCuesheetMode()', () => {
  it('honors the stored mode when the user can change mode on the current rundown', () => {
    const permissions = { canChangeMode: true };

    expect(getEffectiveCuesheetMode(permissions, AppMode.Edit, { canRunMode: true })).toBe(AppMode.Edit);
    expect(getEffectiveCuesheetMode(permissions, AppMode.Run, { canRunMode: true })).toBe(AppMode.Run);
  });

  it('forces Run mode when the preset forbids mode changes', () => {
    const permissions = { canChangeMode: false };

    expect(getEffectiveCuesheetMode(permissions, AppMode.Edit, { canRunMode: true })).toBe(AppMode.Run);
  });

  it('forces Edit mode for background rundowns without changing the permission policy', () => {
    const permissions = { canChangeMode: true };

    expect(getEffectiveCuesheetMode(permissions, AppMode.Run, { canRunMode: false })).toBe(AppMode.Edit);
  });
});
