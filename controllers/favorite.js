const Favorite = require("../models/favorite");
const asyncHandler = require("express-async-handler");
const sttCode = require("../enum/statusCode");
const User = require("../models/user");
const Chapter = require("../models/chapter");
const statusCode = require("../enum/statusCode");

const createFavorite = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) throw new Error("Authentication required");
  const userID = req.user._id;
  const { comicID } = req.body;
  if (!comicID) throw new Error("Missing input");
  const favorite = await Favorite.findOne({ user: userID, comic: comicID })
  if(favorite) return res.status(statusCode.Ok).json({
    success: false,
    mes: 'Favorite already!'
  })
  const newFavorite = await Favorite.create({ user: userID, comic: comicID });
  return res.status(statusCode.Ok).json({
    success: newFavorite ? true : false,
    mes: newFavorite ? newFavorite : "Something went wrong",
  });
});
const getFavorite = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) throw new Error("Authentication required");
  const userID = req.user._id;
  const { comicID } = req.params;
  const favorite = await Favorite.find({ user: userID, comic: comicID }).populate(
    "comic",
    "coverImage title slug"
  );
  return res.status(statusCode.Ok).json({
    success: favorite ? true : false,
    mes: favorite ? favorite : "Something went wrong",
  });
});

const getAllFavorite = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) throw new Error("Authentication required");
  const userID = req.user._id;
  const favorite = await Favorite.find({ user: userID }).populate(
    "comic",
    "coverImage title slug"
  );
  return res.status(statusCode.Ok).json({
    success: favorite ? true : false,
    mes: favorite ? favorite : "Something went wrong",
  });
});

const deleteFavorite = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) throw new Error("Authentication required");
  const userID = req.user._id;
  const { comicID } = req.body;
  if (!comicID) throw new Error("Missing input");
  const favorite = await Favorite.findOneAndDelete({comic: comicID})
  return res.status(statusCode.Ok).json({
    success: favorite ? true : false,
    mes: favorite ? 'Delete successfully' : "Something went wrong",
  })

});
module.exports = {
  createFavorite,
  getFavorite,
  deleteFavorite,
  getAllFavorite
};
