const Chapter = require("../models/chapter");
const Purchase = require("../models/purchase");
const asyncHandler = require("express-async-handler");
const sttCode = require("../enum/statusCode");
const Comic = require("../models/comic");
const { formidable } = require("formidable");
const cloudinary = require("../config/cloudinary.config");
const multipleUploadMiddleware = require("../middlewares/uploadImg");

const getListChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const chapter = await Chapter.find({ comic: id })
    .sort("-chapNumber")
    .select("-images");
  return res.status(sttCode.Ok).json({
    success: chapter ? true : false,
    mes: chapter ? chapter : "Something went wrong!",
  });
});

// const createChapter = asyncHandler(async (req, res) => {
//   const form = formidable({ multiples: true });
//   let formParse;
//   formParse = await form.parse(req);
//   let { comic, chapNumber, price } = formParse[0];
//   comic = JSON.parse(JSON.stringify(comic).toString().replace(/\[|\]/g, ""));
//   chapNumber = JSON.parse(
//     JSON.stringify(chapNumber).toString().replace(/\[|\]/g, "")
//   );
//   price = JSON.parse(JSON.stringify(price).toString().replace(/\[|\]/g, ""));
//   const data = {
//     comic,
//     chapNumber,
//     price,
//   };
//   const rs = await Chapter.findOne({ chapNumber, comic });
//   const comicRecord = await Comic.findById(comic).select("title");
//   if (rs)
//     throw new Error(
//       `Chapter ${chapNumber} of "${comicRecord.title}" is already in database`
//     );
//   const newChapter = await Chapter.create(data);
//   if (newChapter) {
//     const uploadedImages = [];
//     const files = formParse[1];
//     for (let i = 0; i < files.image.length; i++) {
//       const image = files.image[i];
//       const filename = `${i}`;
//       const result = await cloudinary.uploader.upload(image.filepath, {
//         folder: `${comic[0]}/${chapNumber}/`,
//         public_id: filename,
//       });

//       const publicUrl = result.secure_url;
//       uploadedImages.push(publicUrl);
//     }

//     // Tiếp tục xử lý logic của bạn với uploadedImages (mảng chứa các đường dẫn công khai của các ảnh đã tải lên)
//     const updateChapter = await Chapter.findByIdAndUpdate(
//       newChapter._id,
//       { images: uploadedImages },
//       { new: true }
//     );
//     return res.status(sttCode.Ok).json({
//       success: updateChapter ? true : false,
//       mes: updateChapter
//         ? "Add chapter successfully"
//         : "Error creating chapter",
//     });
//   }
// });
const createChapter = asyncHandler(async (req, res) => {
  let { comic, chapNumber, price } = req.body;
  if (!comic || !chapNumber) throw new Error("Missing input!");
  // Check exist
  const rs = await Chapter.findOne({ chapNumber, comic });
  const comicRecord = await Comic.findById(comic).select("title");
  if (rs)
    throw new Error(
      `Chapter ${chapNumber} of "${comicRecord.title}" is already in database`
    );
  const images = req.files.map((el) => {
    return el.path.replace("public", "");
  });
  console.log(images);
  const data = {
    ...req.body,
    images,
  };

  const newChapter = Chapter.create(data);
  return res.status(sttCode.Ok).json({
    success: newChapter ? true : false,
    mes: newChapter ? "Create chapter successfully" : "Error creating chapter",
  });
});
const getChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Invalid id chapter");
  else {
    const chapter = await Chapter.findById(id).populate("comic");
    if (req?.user?.role === "admin") {
      await Chapter.findByIdAndUpdate(
        id,
        {
          $inc: {
            viewCount: 1,
          },
        },
        { new: true }
      );
      return res.status(sttCode.Ok).json({
        success: true,
        mes: chapter,
      });
    } else {
      if (chapter.price === 0) {
        await Chapter.findByIdAndUpdate(
          id,
          {
            $inc: {
              viewCount: 1,
            },
          },
          { new: true }
        );
        return res.status(sttCode.Ok).json({
          success: true,
          mes: chapter,
        });
      } else {
        if (!req.user)
          return res.status(sttCode.Unauthorized).json({
            success: false,
            mes: "Please go to the login page!",
          });
        else {
          const { _id } = req.user;
          if (!_id) throw new Error("Please go to the login page!");
          else {
            const purchase = await Purchase.findOne({ user: _id, chapter: id });
            if (purchase) {
              const incView = await Chapter.findByIdAndUpdate(
                id,
                {
                  $inc: {
                    viewCount: 1,
                  },
                },
                { new: true }
              );
              console.log(incView);
              return res.status(sttCode.Ok).json({
                success: true,
                mes: chapter,
              });
            }
            else throw new Error("This chapter requires purchase to view");
          }
        }
      }
    }
  }
});
const deleteChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Missing id");
  const chapter = await Chapter.findByIdAndDelete(id);
  return res.status(sttCode.Ok).json({
    success: chapter ? true : false,
    mes: chapter ? "Delete success" : "Something went wrong!",
  });
});

const getListChapterWithSlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const comic = await Comic.findOne({ slug: slug });
  const chapter = await Chapter.find({ comic: comic._id }).sort("-chapNumber");
  return res.status(sttCode.Ok).json({
    success: chapter ? true : false,
    mes: chapter ? chapter : "Something went wrong!",
  });
});

const getAllChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.find().countDocuments();
  return res.status(sttCode.Ok).json({
    success: chapter ? true : false,
    mes: chapter ? chapter : "Something went wrong!",
  });
});

const updatePrice = asyncHandler(async (req, res) => {
  const {id} = req.params
  const chapter = await Chapter.updateMany(
    { chapNumber: { $gt: 3 } },
    { price: 50 }
  );
  return res.json("oke");
});
const updateChapter = asyncHandler(async (req, res) => {
  const {id} = req.params
  let { comic, chapNumber } = req.body;
  if (!comic || !chapNumber) throw new Error("Missing input!");
  
  const images = req.files.map((el) => {
    return el.path.replace("public", "");
  });
  const data = {
    ...req.body,
    images,
  };

  const newChapter = await Chapter.findById(id)
  const img = [...newChapter.images, images]
  newChapter.images = img
  newChapter.save();
  return res.status(sttCode.Ok).json({
    success: newChapter ? true : false,
    mes: newChapter ? "Update chapter successfully" : "Error update chapter",
  });
})
module.exports = {
  createChapter,
  getListChapter,
  deleteChapter,
  getChapter,
  getListChapterWithSlug,
  getAllChapter,
  updatePrice,
  updateChapter,
};
