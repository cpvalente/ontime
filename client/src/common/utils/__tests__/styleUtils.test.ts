import { cx } from '../styleUtils';

import style from './styleUtils.module.scss';

describe('cx()', () => {
  test('merges styles', () => {
    const merged = cx([style.test, style.another]);
    expect(merged).toMatchSnapshot();
  });
  test('ignores falsy values', () => {
    const falsyStuff = false;
    const merged = cx([undefined, false, 0, null, falsyStuff ? style.test : null]);
    expect(merged).toMatchSnapshot();
  });
});
