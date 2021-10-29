import multer from 'multer';
import { statSync, mkdirSync } from 'fs';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let newDestination = 'uploads/';
    let stat = null;
    try {
      stat = statSync(newDestination);
    } catch (err) {
      mkdirSync(newDestination);
    }
    if (stat && !stat.isDirectory()) {
      throw new Error(
        'Directory cannot be created because an inode of a different type exists at "' +
          dest +
          '"'
      );
    }
    cb(null, newDestination);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '--' + file.originalname);
  },
});

// filter only json
const filterJson = (req, file, cb) => {
  if (file.mimetype.includes('application/json')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadJson = multer({ storage: storage, fileFilter: filterJson });

export default uploadJson.single('jsondb');
