const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const sttCode = require("../enum/statusCode");
const Comic = require("../models/comic");

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers?.authorization?.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err)
        res.status(sttCode.Unauthorized).json({
          success: false,
          mes: "Invalid Access Token",
        });
      else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(sttCode.Unauthorized).json({
      success: false,
      mes: "Authentication Required",
    });
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  const { role } = req.user;
  if (role !== "admin")
    return res.status(sttCode.Unauthorized).json({
      success: false,
      mes: "Required Admin Role",
    });
  next();
});

const isAuthor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const authorID = req.user?._id;
  if (!id) throw new Error("Invalid id");
  const comic = await Comic.findById(id);
  if (!comic)
    return res.status(sttCode.NotFound).json({
      success: false,
      mes: "Not Found Comic with id " + id,
    });
  if(req.user.role === 'admin') {
    next();
  } else {
    if (authorID.localeCompare(comic.createdBy?._id) !== 0) {
      return res.status(sttCode.Unauthorized).json({
        success: false,
        mes: "Required Author Role",
      });
    }
    next();
  }
});

module.exports = {
  verifyAccessToken,
  isAdmin,
  isAuthor,
};
