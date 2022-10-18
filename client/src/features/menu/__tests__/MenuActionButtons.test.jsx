import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { queryClientMock } from '../../../__mocks__/QueryClient.mock';
import MenuActionButtons from '../MenuActionButtons';

const actionHandler = vi.fn();
const renderInMock = () => {
  render(
    <QueryClientProvider client={queryClientMock}>
      <MenuActionButtons actionHandler={actionHandler} />
    </QueryClientProvider>,
  );
};

test('check that menu bar renders correctly', () => {
  // need to inject the react query provider
  renderInMock();

  const b = screen.getByRole('button', {
    name: /create menu/i,
  });

  expect(b).toBeInTheDocument();
});