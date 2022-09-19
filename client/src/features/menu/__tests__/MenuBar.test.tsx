import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { queryClientMock } from '../../../__mocks__/QueryClient.mock';
import MenuBar from '../MenuBar';

const onSettingOpenHandler = jest.fn();
const onSettingsCloseHandler = jest.fn();
const isOpen = false;
const onUploadOpenHandler = jest.fn();

const renderInMock = () => {
  render(
    <QueryClientProvider client={queryClientMock}>
      <MenuBar
        isSettingsOpen={isOpen}
        onSettingsOpen={onSettingOpenHandler}
        onSettingsClose={onSettingsCloseHandler}
        isUploadOpen={isOpen}
        onUploadOpen={onUploadOpenHandler}
      />
    </QueryClientProvider>
  );
};

test('check that menu bar renders correctly', () => {
  // need to inject the react query provider
  renderInMock();

  const nButtons = screen.getAllByRole('button').length;
  expect(nButtons).toBe(7);
});
