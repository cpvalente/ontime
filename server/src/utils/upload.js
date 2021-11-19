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

// filter allowed types json
const jsonMime = 'application/json';
const excelMime =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const filterAllowed = (req, file, cb) => {
  console.log(file);
  if (file.mimetype.includes(jsonMime) || file.mimetype.includes(excelMime)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const uploadFile = multer({
  storage: storage,
  fileFilter: filterAllowed,
}).single('userFile');
