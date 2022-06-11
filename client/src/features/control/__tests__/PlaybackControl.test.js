import React from 'react';
import { render, screen } from '@testing-library/react';
import SocketProvider from 'app/context/socketContext';

import PlaybackControl from '../playback/PlaybackControl';

test('check that playback control renders', async () => {
  // need to inject the socket provider to make component
  // render without failing
  render(
    <SocketProvider>
      <PlaybackControl />
    </SocketProvider>
  );

  // Text labels for times
  // substring match, ignore case
  expect(screen.getByText(/started/i)).toBeInTheDocument();
  expect(screen.getByText(/finish/i)).toBeInTheDocument();
});
