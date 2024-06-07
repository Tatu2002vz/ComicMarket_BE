const History = require("../models/history");
const asyncHandler = require("express-async-handler");
const sttCode = require("../enum/statusCode");
const User = require("../models/user");
const Chapter = require("../models/chapter");
const statusCode = require("../enum/statusCode");

const createHistory = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) throw new Error("Authentication required");
  const userID = req.user._id;
  const { comicID, chapterID } = req.body;
  if (!comicID || !chapterID) throw new Error("Missing input");
  const history = await History.findOne({
    user: userID,
    comic: comicID,
  }).populate('chapter', 'chapNumber');
  if (!history) {
    const newHistory = await History.create({
      user: userID,
      chapter: chapterID,
      comic: comicID,
    });
    return res.status(statusCode.Ok).json({
      success: newHistory ? true : false,
      mes: newHistory,
    });
  } else {
    const chapter = await Chapter.findById(chapterID).select('chapNumber')
    if(+history.chapter.chapNumber < +chapter.chapNumber) {
      history.chapter = chapterID;
      await history.save()
      return res.status(statusCode.Ok).json({
        success: true,
        mes: history
      })
    }
    return res.status(statusCode.Ok).json({
      success: true
    })
  }
});
const getHistory = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) throw new Error("Authentication required");
  const userID = req.user._id;
  const history = await History.find({ user: userID })
    .populate("comic", "title coverImage" )
    .populate("chapter","chapNumber" )
    .sort('comic.title chapter.chapNumber')
  return res.status(statusCode.Ok).json({
    success: history ? true : false,
    mes: history ? history : "Something went wrong",
  });
});

module.exports = {
  createHistory,
  getHistory,
};
