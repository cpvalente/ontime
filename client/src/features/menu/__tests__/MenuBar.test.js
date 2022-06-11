import React from 'react';
import { QueryClientProvider } from 'react-query';
import { render, screen } from '@testing-library/react';

import { queryClientMock } from '../../../__mocks__/QueryClient.mock';
import MenuBar from '../MenuBar';

const onOpenHandler = jest.fn();
const onCloseHandler = jest.fn();

const renderInMock = () => {
  render(
    <QueryClientProvider client={queryClientMock}>
      <MenuBar onOpen={onOpenHandler} onClose={onCloseHandler} />
    </QueryClientProvider>
  );
};

test('check that menu bar renders correctly', () => {
  // need to inject the react query provider
  renderInMock();

  const nButtons = screen.getAllByRole('button').length;
  expect(nButtons).toBe(7);
});
