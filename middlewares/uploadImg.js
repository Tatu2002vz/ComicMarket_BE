const multer = require("multer");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const Comic = require("../models/comic");
const Chapter = require("../models/chapter");
const { default: slugify } = require("slugify");
const storage = multer.diskStorage({
  destination: asyncHandler(async function (req, file, cb) {
    let { comic, chapNumber } = req.body;
    console.log(req.body);

    const comicRecord = await Comic.findById(comic).select("slug");

    // Get folder path
    const folderPath = `public/${comicRecord.slug}/chapter-${chapNumber}/`;

    // Create folder
    if (!fs.existsSync(folderPath)) {
      await fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  }),
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + slugify(file.originalname).replaceAll(" ", "-");
    cb(null, name);
  },
});

module.exports = multer({ storage: storage });
