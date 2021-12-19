import { render, screen } from '@testing-library/react';
import MenuBar from "../MenuBar";
import {queryClientMock} from "../../../__mocks__/QueryClient.mock";
import {QueryClientProvider} from "react-query";

const onOpenHandler = jest.fn();
const renderInMock = () => {
  render(
    <QueryClientProvider client={queryClientMock}>
      <MenuBar onOpen={onOpenHandler} />
    </QueryClientProvider>
  )
};

test('check that menu bar renders correctly', () => {
  // need to inject the react query provider
  renderInMock();

  const nButtons = screen.getAllByRole("button").length;
  expect(nButtons).toBe(7);
});
