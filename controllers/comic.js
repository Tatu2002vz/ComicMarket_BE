const Comic = require("../models/comic");
const asyncHandler = require("express-async-handler");
const sttCode = require("../enum/statusCode");
const cloudinary = require("../config/cloudinary.config");
const slugify = require("slugify");
const { formidable } = require("formidable");
const createComic = asyncHandler(async (req, res) => {
  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      // Xử lý lỗi nếu có
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }

    // Lấy giá trị từ trường comic và chapter
    let { title, description, genres } = fields;

    const genresConver = genres.toString().split(",");
    // Xử lý dữ liệu vào
    if (!title) throw new Error("Title must not be empty");
    // Chuyển các key từ Object thành String
    title = JSON.parse(JSON.stringify(title).toString().replace(/\[|\]/g, ""));
    description = JSON.parse(
      JSON.stringify(description).toString().replace(/\[|\]/g, "")
    );
    // let genre = Object.values(genres).map((el) => {
    //   return JSON.parse(JSON.stringify(el).toString().replace(/\[|\]/g, ""));
    // });
    const { _id } = req.user;
    const data = {
      title,
      slug: slugify(title),
      description,
      genre: [...genresConver],
      createdBy: _id,
    };
    const checkExsist = await Comic.findOne({ slug: data.slug });
    if (checkExsist)
      return res.status(sttCode.Ok).json({
        success: false,
        mes: "Comic already in database",
      });
    const newComic = await Comic.create(data);
    if (newComic) {
      try {
        // Upload tệp tin img lên Cloudinary
        const result = await cloudinary.uploader.upload(
          files.coverImage[0].filepath,
          {
            folder: `comicMarket/`,
          }
        );
        // Lấy đường dẫn công khai của tệp tin đã upload
        const coverImage = result.secure_url;
        const updateComic = await Comic.findByIdAndUpdate(
          newComic._id,
          { coverImage },
          { new: true }
        );
        return res.status(sttCode.Ok).json({
          success: updateComic ? true : false,
          mes: updateComic ? "Create a comic success" : "Something went wrong",
        });
      } catch (error) {
        // Xử lý lỗi nếu có
        console.error(error);
        return res.status(500).json({ error: "Something went wrong" });
      }
    }
    throw new Error("Error creating comic");
  });
  // const { title, description, coverImage, genre } = req.body;
  // const { _id } = req.user;
  // req.body.createdBy = _id;
  // if (!title || !description || !coverImage || !genre)
  //   throw new Error("Missing input");
  // req.body.slug = slugify(title);
  // const newComic = await Comic.create(req.body);
  // return res.status(sttCode.Ok).json({
  //   success: newComic ? true : false,
  //   mes: newComic ? newComic : "Something went wrong!",
  // });
});
const uploadImg = asyncHandler(async (req, res) => {
  const form = formidable({ multiples: true });
});
const getComic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.params || !req.params.id) throw new Error("Missing input");
  const comic = await Comic.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate("genre");
  return res.status(sttCode.Ok).json({
    success: comic ? true : false,
    mes: comic ? comic : "Something went wrong!",
  });
});

const getComicWithTitle = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (title !== "" && title) {
    const regex_title = new RegExp(title, "i");
    const regex_slug = new RegExp(slugify(title), "i");
    // Hiển thị kết quả không sát với từ khoá cần tìm
    // const comic = await Comic.find({$or: [{title: regex_title}, {slug: regex_slug}]})
    // Chia ra để hiển thị kết quả trực quan hơn
    const searchTitle = await Comic.find({ title: regex_title });
    const searchSlug = await Comic.find({ slug: regex_slug });
    const comic = [...searchTitle, ...searchSlug];
    const comicFilter = [];

    // Lọc các bộ truyện trùng nhau
    for (let item of comic) {
      let check = true;
      for (let index of comicFilter) {
        if (item.slug == index.slug) {
          check = false;
          break;
        }
      }
      if (check) {
        comicFilter.push(item);
      }
    }
    return res.status(sttCode.Ok).json({
      success: comic ? true : false,
      mes: comic ? comicFilter : "Something went wrong!",
    });
  } else {
    return res.status(sttCode.Ok).json({
      success: false,
    });
  }
});

const getComics = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  // Tách các trường đặc biệt ra khỏi query
  const excludeFields = ["limit", "sort", "page", "fields"];
  excludeFields.forEach((el) => delete queries[el]);
  // Forrmat lại các operator cho đúng cú pháp mongoose
  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(
    /\b(gte|gt|lt|lte)\b/g,
    (matchedEl) => `$${matchedEl}`
  );

  const formatedQueries = JSON.parse(queryString);

  // Filtering
  if (queries?.title)
    formatedQueries.title = { $regex: queries.title, $options: "i" };
  let queryCommand = Comic.find(formatedQueries);

  //Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    queryCommand = queryCommand.sort(sortBy);
  }

  // Fields limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    queryCommand = queryCommand.select(fields);
  }

  // Pagination
  // Thêm dấu + => chuyển sang dạng số
  // + 2 => 2
  // + dssss => nan
  const page = +req.query.page || 1;
  const limit = +req.query.limit || process.env.LIMIT_PRODUCT;
  const skip = (page - 1) * limit;

  queryCommand.skip(skip).limit(limit);

  // Sử dụng async/await
  const response = await queryCommand.exec();
  const counts = await Comic.find(formatedQueries).countDocuments();
  return res.status(sttCode.Ok).json({
    success: response ? true : false,
    counts,
    mes: response ? response : "Cannot get all comic",
  });
});

const updateComic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.params.id) throw new Error("Invalid id");
  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    if (err) {
      // Xử lý lỗi nếu có
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }

    // Lấy giá trị từ trường comic và chapter
    let { title, description, genres } = fields;

    const genresConver = genres.toString().split(",");
    // Xử lý dữ liệu vào
    if (!title) throw new Error("Title must not be empty");
    // Chuyển các key từ Object thành String
    title = JSON.parse(JSON.stringify(title).toString().replace(/\[|\]/g, ""));
    description = JSON.parse(
      JSON.stringify(description).toString().replace(/\[|\]/g, "")
    );
    // let genre = Object.values(genres).map((el) => {
    //   return JSON.parse(JSON.stringify(el).toString().replace(/\[|\]/g, ""));
    // });
    const { _id } = req.user;
    const data = {
      title,
      slug: slugify(title),
      description,
      genre: [...genresConver],
      createdBy: _id,
    };
    const oldComic = await Comic.findById(id);

    try {
      // Lấy public ID từ đường dẫn công khai
      const publicId = cloudinary
        .url(oldComic.coverImage, { secure: true })
        .split("/")
        .pop()
        .split(".")
        .shift();

      // Gọi phương thức xóa tệp tin từ Cloudinary SDK
      const result = await cloudinary.uploader.destroy(publicId);

      console.log("Delete successful:", result);
      if (result) {
        const newComic = await Comic.findByIdAndUpdate(
          id,
          { ...data },
          { new: true }
        );
        if (newComic) {
          try {
            // Upload tệp tin img lên Cloudinary
            const result = await cloudinary.uploader.upload(
              files.coverImage[0].filepath,
              {
                folder: `comicMarket/`,
              }
            );
            // Lấy đường dẫn công khai của tệp tin đã upload
            const coverImage = result.secure_url;
            const updateComic = await Comic.findByIdAndUpdate(
              id,
              { coverImage },
              { new: true }
            );
            return res.status(sttCode.Ok).json({
              success: updateComic ? true : false,
              mes: updateComic
                ? "Create a comic success"
                : "Something went wrong",
            });
          } catch (error) {
            // Xử lý lỗi nếu có
            console.error(error);
            return res.status(500).json({ error: "Something went wrong" });
          }
        }
      }
      // Xử lý khi xoá tệp tin thành công
    } catch (error) {
      console.error("Delete failed:", error);
      // Xử lý khi xoá tệp tin thất bại
    }
    throw new Error("Error creating comic");
  });
});

const deleteComic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.params || !req.params.id) throw new Error("Invalid id");
  const comic = await Comic.findByIdAndDelete(id);
  return res.status(sttCode.Ok).json({
    success: comic ? true : false,
    mes: comic ? "Delete Success" : "Something went wrong",
  });
});

module.exports = {
  createComic,
  getComic,
  getComics,
  deleteComic,
  updateComic,
  uploadImg,
  getComicWithTitle,
};
