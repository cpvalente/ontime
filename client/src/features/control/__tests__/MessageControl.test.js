import React from 'react';
import { render, screen } from '@testing-library/react';
import SocketProvider from 'app/context/socketContext';

import MessageControl from '../message/MessageControl';

// need to inject the socket provider to make component
// render without failing
const MockMessageControl = () => {
  return (
    <SocketProvider>
      <MessageControl />
    </SocketProvider>
  );
};

describe('Message Control input blocks', () => {
  test('Presenter dialog', async () => {
    // Presenter dialog and button
    // substring match, ignore case
    render(<MockMessageControl />);
    expect(screen.getByPlaceholderText(/presenter/i)).toBeInTheDocument();
  });

  test('Public dialog', async () => {
    // Public dialog and button
    // substring match, ignore case
    render(<MockMessageControl />);
    expect(screen.getByPlaceholderText(/public/i)).toBeInTheDocument();
  });

  test('Lower third', async () => {
    // Lower third dialog and button
    // substring match, ignore case
    render(<MockMessageControl />);
    expect(screen.getByPlaceholderText(/lower third/i)).toBeInTheDocument();
  });
});
