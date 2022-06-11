import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EditableTimer from '../EditableTimer';

const renderEditableTimer = (
  name = 'test',
  actionHandler = () => undefined,
  validate = () => undefined
) => render(<EditableTimer name={name} actionHandler={actionHandler} validate={validate} />);

describe('test EditableTimer component', () => {
  const testName = "test";
  const actionHandler = jest.fn();
  const validate = jest.fn();

  renderEditableTimer(testName, actionHandler, validate);
  const editableTimer = screen.getByTestId('editable-timer');
  const editableInput = screen.getByTestId('editable-timer-input');

  // skipping for now as error seems to come from beta library
  it.skip('renders correctly', () => {
    expect(editableTimer).toBeInTheDocument();
    expect(editableInput).toBeInTheDocument();

    const myTypedString = 'verylongandcool'
    userEvent.type(editableInput, myTypedString);
    expect(editableInput).toHaveValue(myTypedString);

    userEvent.type(editableInput, '{enter}');

    // no previous is given, defaults to 0
    expect(validate).toHaveBeenCalledWith(testName, 0);
  });
});
