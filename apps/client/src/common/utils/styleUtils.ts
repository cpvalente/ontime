import { RGBColour } from 'ontime-types';
import { colourToHex, cssOrHexToColour, isLightColour, mixColours } from 'ontime-utils';

type ColourCombination = {
  backgroundColor: string;
  color: string;
};

const defaultUiBackground: RGBColour = { red: 26, green: 26, blue: 26, alpha: 1 };
/**
 * @description Selects text colour to maintain accessible contrast
 * @param bgColour
 * @return {{backgroundColor, color: string}}
 */
export const getAccessibleColour = (bgColour?: string): ColourCombination => {
  if (!bgColour) return { backgroundColor: '#1a1a1a', color: '#fffffa' };

  const originalColour = cssOrHexToColour(bgColour);
  if (!originalColour) return { backgroundColor: '#1a1a1a', color: '#fffffa' };

  const backgroundColorMix = mixColours(defaultUiBackground, originalColour, 1 - originalColour.alpha);
  const textColor = isLightColour(backgroundColorMix) ? 'black' : '#fffffa';

  return { backgroundColor: colourToHex(backgroundColorMix), color: textColor };
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
  const originalColour = cssOrHexToColour(colour);
  if (!originalColour) return colour;
  originalColour.alpha = amount;
  return colourToHex(originalColour);
}
