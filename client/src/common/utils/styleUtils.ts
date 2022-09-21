import Color from 'color';

type ColourCombination = {
  backgroundColor: string;
  color: string;
}

/**
 * @description Selects text colour to maintain accessible contrast
 * @param bgColour
 * @return {{backgroundColor, color: string}}
 */
export const getAccessibleColour = (bgColour: string): ColourCombination => {
  if (bgColour) {
    try {
      const textColor = Color(bgColour).isLight() ? 'black' : '#fffffa';
      return { backgroundColor: bgColour, color: textColor };
    } catch (error) {
      console.log(`Unable to parse colour: ${bgColour}`);
    }
  }
  return { backgroundColor: '#000', color: "#fffffa" };
};
