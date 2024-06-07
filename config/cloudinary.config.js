const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const asyncHandler = require('express-async-handler');
const {createFolderImage} = require('../middlewares/createFolderImage');
const formidable = require('formidable')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});



// const storage = new CloudinaryStorage({
//   cloudinary,
//   allowedFormats: ["jpg", "png"],
//   params: {
//     folder: getFolderImage(),
//   },
// });

// const uploadCloud = multer({ storage });

module.exports = cloudinary;
