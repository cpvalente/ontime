import React from 'react';
import { render, screen } from '@testing-library/react';

import MenuActionButtons from "../MenuActionButtons";

const actionHandler = jest.fn();
const renderInMock = () => {
  render(<MenuActionButtons actionHandler={actionHandler} />)
};

test('check that menu bar renders correctly', () => {
  // need to inject the react query provider
  renderInMock();

  const b = screen.getByRole('button', {
    name: /create menu/i
  })

  expect(b).toBeInTheDocument();
});
