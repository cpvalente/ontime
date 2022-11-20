import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { queryClientMock } from '../../../__mocks__/QueryClient.mock';
import PlaybackControl from '../playback/PlaybackControl';


test('check that playback control renders', async () => {
  // need to inject the socket provider to make component
  // render without failing
  render(
    <QueryClientProvider client={queryClientMock}>
      <PlaybackControl />
    </QueryClientProvider>,
  );

  // Text labels for times
  // substring match, ignore case
  expect(screen.getByText(/started/i)).toBeInTheDocument();
  expect(screen.getByText(/finish/i)).toBeInTheDocument();
});
