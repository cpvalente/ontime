import { cx, getAccessibleColour } from '../styleUtils';

import style from './styleUtils.module.scss';

describe('cx()', () => {
  it('merges styles', () => {
    const merged = cx([style.test, style.another]);
    expect(merged).toMatchSnapshot();
  });
  it('ignores falsy values', () => {
    const falsyStuff = false;
    const merged = cx([undefined, false, 0, null, falsyStuff ? style.test : null]);
    expect(merged).toMatchSnapshot();
  });
});

describe('getAccessibleColour()', () => {
  it('handles named colours', () => {
    const colour = 'red';
    const { backgroundColor, color } = getAccessibleColour(colour);
    expect(backgroundColor).toBe('#FF0000FF');
    expect(color).toBe('#fffffa');
  });
  it('handles hex colours', () => {
    const colour = '#0F0';
    const { backgroundColor, color } = getAccessibleColour(colour);
    expect(backgroundColor).toBe('#00FF00FF');
    expect(color).toBe('black');
  });
  it('handles transparens', () => {
    const colour = '#0F08';
    const { backgroundColor, color } = getAccessibleColour(colour);
    expect(backgroundColor).toBe('#0C940CFF');
    expect(color).toBe('#fffffa');
  });
});
