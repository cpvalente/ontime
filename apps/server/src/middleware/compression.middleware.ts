import { constants as zlibConstants } from 'node:zlib';

import compression from 'compression';

export const compressData = compression({
  level: 1,
  threshold: 1024,
  brotli: { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 1 } },
});
