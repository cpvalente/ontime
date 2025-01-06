import expressStaticGzip from 'express-static-gzip';
import { extname } from 'node:path';

import { srcDir } from '../setup/index.js';

// serve static - react, in dev/test mode we fetch the React app from module
export const compressedStatic = expressStaticGzip(srcDir.clientDir, {
  enableBrotli: true,
  orderPreference: ['br'],
  // when we build the client the file names contain a unique hash for the build
  // this allows us to use the immutable tag
  // as the contents of a build file will never change without also changing its name
  // meaning that the client does not need to revalidate the contents with the server
  serveStatic: {
    etag: false,
    lastModified: false,
    immutable: true,
    maxAge: '1y',
    setHeaders: (res, file) => {
      // make sure the HTML files are always revalidated
      if (extname(file) === '.html') {
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    },
  },
});
