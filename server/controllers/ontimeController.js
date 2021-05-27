// Create controller for GET request to '/ontime/download'
import { db, data } from '../app.js';
function getEventTitle() {
  return data.event.title;
}
// Returns -
export const dbDownload = async (req, res) => {
  const fileTitle = getEventTitle() || 'ontime events';
  res.download('db.json', `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};
