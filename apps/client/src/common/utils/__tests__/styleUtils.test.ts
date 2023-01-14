import { cx } from '../styleUtils';

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
