import { render, screen } from '@testing-library/react';
import SocketProvider from 'app/context/socketContext';
import MessageControl from './MessageControl';

test('check that all dialog boxed render', async () => {
  // need to inject the socket provider to make component
  // render without failing
  render(
    <SocketProvider>
      <MessageControl />
    </SocketProvider>
  );

  // Presenter dialog and button
  // substring match, ignore case
  expect(screen.getByPlaceholderText(/presenter/i)).toBeInTheDocument();

  // Public dialog and button
  // substring match, ignore case
  expect(screen.getByPlaceholderText(/public/i)).toBeInTheDocument();

  // Lower third dialog and button
  // substring match, ignore case
  expect(screen.getByPlaceholderText(/lower third/i)).toBeInTheDocument();
});
