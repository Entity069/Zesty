const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/profile-pics/';
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const suffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `profile-${suffix}${ext}`);
  }
});

const storageItem = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/item-images/';
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const suffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `item-image-${suffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadProfile = multer({
  storage: storageProfile,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadItem = multer({
  storage: storageItem,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = {
  uploadProfile,
  uploadItem

};