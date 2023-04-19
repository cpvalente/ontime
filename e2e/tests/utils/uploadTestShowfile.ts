import fs from 'fs';
import path from 'path';

// haven't been able to get this to work
// it is well discussed in the issues, so should be able to find something
// https://playwrightsolutions.com/making-a-post/
// https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-fetch
// the upload is accepted by backend we receive 400 after upload and parse

export async function uploadTestDb(request) {
  const filePath = path.resolve('e2e/tests/fixtures/test-db.json');
  const file = fs.readFileSync(filePath);

  const response = await request.post('http://localhost:4001/ontime/db?onlyRundown=false', {
    multipart: {
      file: {
        fileName: filePath,
        mimeType: "application/json",
        buffer: file,
      },
    },
  });

  return response;
}
