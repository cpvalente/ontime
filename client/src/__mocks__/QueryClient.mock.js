import {QueryClient} from "react-query";

export const queryClientMock = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});