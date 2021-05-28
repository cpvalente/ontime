import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
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
