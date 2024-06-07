const asyncHandler = require("express-async-handler");
const Chapter = require("../models/chapter");
const sttCode = require("../enum/statusCode");
const Comment = require("../models/comment");

// const getAllComments = asyncHandler(async(req, res) => {
//     const {id} = req.params;
// })

const getCommentWithIdChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = await Comment.find({ chapter: id }).populate(
    "comic chapter user"
  ).sort('-createdAt');
  const count = comments.length;
  const data = Array.from(comments).map((item) => {
    return {
      user: item.user.fullname,
      avatar: item.user.avatar,
      comic: item.comic.title,
      chapter: item.chapter.chapNumber,
      content: item.content,
      createdAt: item.createdAt
    };
  });
  return res.status(sttCode.Ok).json({
    success: comments ? true : false,
    count: count,
    mes: comments ? data : "Something went wrong",
  });
});
const getCommentWithComic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Invalid id comic");
  const comments = await Comment.find({ comic: id }).populate(
    "comic chapter user"
  ).sort('-createdAt');
  const count = comments.length;
  const data = Array.from(comments).map((item) => {
    return {
      user: item.user.fullname,
      avatar: item.user.avatar,
      comic: item.comic.title,
      chapter: item?.chapter?.chapNumber,
      content: item.content,
      createdAt: item.createdAt
    };
  });
  return res.status(sttCode.Ok).json({
    success: comments ? true : false,
    count: count,
    mes: comments ? data : "Something went wrong",
  });
});

const createComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, isComic } = req.body;
  const { _id } = req.user;
  if (!_id) throw new Error("Required Authentication");
  let chapter;
  if (isComic !== "true") {
    chapter = await Chapter.findById(id).select("-images");
  }
  const data = {
    user: _id,
    comic: isComic ? id : chapter.comic,
    chapter: isComic ? null : id,
    content,
  };
  const newCmt = await Comment.create(data);
  return res.status(sttCode.Ok).json({
    success: newCmt ? true : false,
    mes: newCmt ? newCmt : "Something went wrong",
  });
});

module.exports = {
  createComment,
  getCommentWithIdChapter,
  getCommentWithComic,
};
