import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { queryClientMock } from '../../../__mocks__/QueryClient.mock';
import MenuBar from '../MenuBar';

const onOpenHandler = vi.fn();
const onCloseHandler = vi.fn();
const isOpen = false;
const onUploadOpenHandler = vi.fn();

const renderInMock = () => {
  render(
    <QueryClientProvider client={queryClientMock}>
      <MenuBar isSettingsOpen={isOpen} onSettingsOpen={onOpenHandler}
               onSettingsClose={onCloseHandler} isUploadOpen={isOpen}
               onUploadOpen={onUploadOpenHandler} />
    </QueryClientProvider>,
  );
};

test('check that menu bar renders correctly', () => {
  // need to inject the react query provider
  renderInMock();

  const nButtons = screen.getAllByRole('button').length;
  expect(nButtons).toBe(7);
});
