import { handleLegacyMessageConversion } from '../integration.legacy.js';

describe('handleLegacyConversion', () => {
  it('should return the payload as is if it is not a legacy message', () => {
    expect(handleLegacyMessageConversion({})).toEqual({});
    const newPayload = {
      timer: {
        text: 'text',
        visible: true,
        blink: true,
        blackout: true,
      },
      external: 'text',
    };
    expect(handleLegacyMessageConversion(newPayload)).toEqual(newPayload);
  });

  it('should convert a legacy payload with external message', () => {
    expect(handleLegacyMessageConversion({ external: { text: 'text', visible: true } })).toEqual({
      external: 'text',
      timer: {
        secondarySource: 'external',
      },
    });

    expect(handleLegacyMessageConversion({ external: { visible: true } })).toEqual({
      timer: {
        secondarySource: 'external',
      },
    });

    expect(handleLegacyMessageConversion({ external: { text: 'text' } })).toEqual({
      external: 'text',
    });
  });
});
