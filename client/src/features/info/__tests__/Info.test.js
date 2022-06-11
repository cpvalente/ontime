import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { render, screen } from '@testing-library/react';
import SocketProvider from 'app/context/socketContext';

import Info from '../Info';

const queryClient = new QueryClient();

test('check static info render', async () => {
  // need to inject the socket provider to make component
  // render without failing
  render(
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Info />
      </SocketProvider>
    </QueryClientProvider>
  );

  // Info titles
  // substring match, ignore case
  expect(screen.getByText(/running/i)).toBeInTheDocument();
  expect(screen.getByText(/event/i)).toBeInTheDocument();
});
