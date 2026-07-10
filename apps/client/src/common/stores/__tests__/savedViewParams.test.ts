import { hasCustomParams, stripReservedParams, useSavedViewParams } from '../savedViewParams';

describe('savedViewParams store', () => {
  beforeEach(() => {
    useSavedViewParams.getState().clearAll();
  });

  it('saves and restores params per view', () => {
    useSavedViewParams.getState().save('timer', 'hideSeconds=true');
    useSavedViewParams.getState().save('backstage', 'showProgress=false');

    expect(useSavedViewParams.getState().params.timer).toBe('hideSeconds=true');
    expect(useSavedViewParams.getState().params.backstage).toBe('showProgress=false');
  });

  it('overwrites the saved params for a view on subsequent saves', () => {
    useSavedViewParams.getState().save('timer', 'hideSeconds=true');
    useSavedViewParams.getState().save('timer', 'hideSeconds=false');

    expect(useSavedViewParams.getState().params.timer).toBe('hideSeconds=false');
  });

  it('clears all saved params', () => {
    useSavedViewParams.getState().save('timer', 'hideSeconds=true');
    useSavedViewParams.getState().clearAll();

    expect(useSavedViewParams.getState().params).toEqual({});
  });
});

describe('stripReservedParams', () => {
  it('removes reserved auth/preset params while keeping view customisation', () => {
    expect(stripReservedParams('hideSeconds=true&token=abc&n=1&alias=my')).toBe('hideSeconds=true');
  });

  it('returns an empty string when only reserved params are present', () => {
    expect(stripReservedParams('token=abc&n=1&alias=my')).toBe('');
  });
});

describe('hasCustomParams', () => {
  it('is true when a non-reserved param is present', () => {
    expect(hasCustomParams(new URLSearchParams('hideSeconds=true&token=abc'))).toBe(true);
  });

  it('is false when only reserved params are present', () => {
    expect(hasCustomParams(new URLSearchParams('token=abc&n=1&alias=my'))).toBe(false);
  });

  it('is false when there are no params', () => {
    expect(hasCustomParams(new URLSearchParams(''))).toBe(false);
  });
});
