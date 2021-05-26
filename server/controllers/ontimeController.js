// Create controller for GET request to '/ontime/download'
// Returns -
export const eventsDownload = async (req, res) => {
  res.download('db.json', 'ontime events.json', (err) => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};
