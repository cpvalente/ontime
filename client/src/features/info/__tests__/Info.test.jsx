import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { queryClientMock } from '../../../__mocks__/QueryClient.mock';
import Info from '../Info';

test('check static info render', async () => {
  // need to inject the socket provider to make component
  // render without failing
  render(
    <QueryClientProvider client={queryClientMock}>
      <Info />
    </QueryClientProvider>,
  );

  // Info titles
  // substring match, ignore case
  expect(screen.getByText(/running/i)).toBeInTheDocument();
  expect(screen.getByText(/event/i)).toBeInTheDocument();
});
