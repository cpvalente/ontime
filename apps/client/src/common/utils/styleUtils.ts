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
      const orgColour = Color(bgColour);
      const preMultColour = orgColour.alpha(1).mix(Color('#1a1a1a'), 1 - orgColour.alpha());
      const textColor = preMultColour.isLight() ? 'black' : '#fffffa';
      return { backgroundColor: preMultColour.hexa(), color: textColor };
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
