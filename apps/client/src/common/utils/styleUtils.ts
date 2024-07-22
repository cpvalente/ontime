import Color from 'color';

type ColourCombination = {
  backgroundColor: string;
  color: string;
};

/**
 * @description Selects text colour to maintain accessible contrast
 * @param bgColour
 * @return {{backgroundColor, color: string}}
 */
export const getAccessibleColour = (bgColour?: string): ColourCombination => {
  if (bgColour) {
    try {
      const originalColour = Color(bgColour);
      const backgroundColorMix = originalColour.alpha(1).mix(Color('#1a1a1a'), 1 - originalColour.alpha());
      const textColor = backgroundColorMix.isLight() ? 'black' : '#fffffa';
      return { backgroundColor: backgroundColorMix.hexa(), color: textColor };
    } catch (_error) {
      /* we do not handle errors here */
    }
  }
  return { backgroundColor: '#1a1a1a', color: '#fffffa' };
};

/**
 * @description Creates a list of classnames from array of css module conditions
 * @param classNames - css modules objects
 */
export const cx = (classNames: any[]) => classNames.filter(Boolean).join(' ');

export const enDash = '–';

export const timerPlaceholder = '––:––:––';
export const timerPlaceholderMin = '––:––';

/**
 * Adds opacity to a given colour if possible
 */
export function alpha(colour: string, amount: number): string {
  try {
    const withAlpha = Color(colour).alpha(amount).hexa();
    return withAlpha;
  } catch (_error) {
    /* we do not handle errors here */
  }
  return colour;
}
