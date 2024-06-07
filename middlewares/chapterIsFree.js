const asyncHandler = require("express-async-handler");
const Chapter = require("../models/chapter");
const verifyToken = require("./verifyToken");
const isFree = asyncHandler(async (req, res, next) => {
  {
    const { id } = req.params;
    if (!id) throw new Error("Invalid id chapter");
    const chapter = await Chapter.findById(id).select("price");
    if (chapter.price !== 0) {
      verifyToken.verifyAccessToken(req, res, next);
    } else next();
  }
});
module.exports = {
  isFree,
};
