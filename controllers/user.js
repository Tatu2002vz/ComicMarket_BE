const User = require("../models/user");
const asyncHandler = require("express-async-handler");

const jwt = require("jsonwebtoken");
const { response } = require("express");

const crypto = require("crypto");
const sttCode = require("../enum/statusCode");
const {
  generateAccessToken,
  generatereFreshToken,
} = require("../middlewares/jwt");
const { sendMail } = require("../utils/sendMail");

const register = asyncHandler(async (req, res) => {
  const { email, password, fullname } = req.body;
  if (!email || !password || !fullname) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  const user = await User.findOne({ email });
  if (user) {
    throw new Error(`User ${user.email} is already registered`);
  } else {
    const response = await User.create(req.body);
    return res.status(200).json({
      success: response ? true : false,
      mes: response ? "Register successfully!" : "Error creating",
    });
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  const response = await User.findOne({ email }).select(
    "-passwordToken -passwordTokenExpiration -refreshToken"
  );
  if (response && (await response.isCorrectPassword(password))) {
    const { password, role, ...userData } = response.toObject();
    const accessToken = generateAccessToken(response._id, role);
    const refreshToken = generatereFreshToken(response._id);
    await User.findOneAndUpdate(response._id, { refreshToken }, { new: true });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      userData: userData,
    });
  } else {
    throw new Error("Email or password is incorrect");
  }
});

const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select(
    "-password -refreshToken -passwordToken -passwordTokenExpiration"
  );
  return res.status(sttCode.Ok).json({
    success: user ? true : false,
    mes: user ? user : "User not found",
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie && !cookie.refreshToken) throw new Error("No refresh token");
  const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
  const user = await User.findOne({
    _id: rs._id,
    refreshToken: cookie.refreshToken,
  });
  return res.status(200).json({
    success: user ? true : false,
    mes: user
      ? generateAccessToken(user._id, user.role)
      : "RefreshToken Invalid",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new Error("Missing email");
  const user = await User.findOne({ email });
  if (user) {
    const tokenPassword = user.createPasswordToken();
    await user.save();
    // const html = `Vui lòng click vào link để lấy lại mật khẩu. Link sẽ hết hạn sau 15 phút. <a href=${process.env.URL_SERVER}api/user/reset-password/${tokenPassword}>Click vào đây</a>`;
    const html = `Vui lòng click vào link để lấy lại mật khẩu. Link sẽ hết hạn sau 15 phút. <a href=${process.env.URL_CLIENT}user/reset-password/${tokenPassword}>Click vào đây</a>`;
    const subject = "Quên mật khẩu";
    const data = {
      email,
      html,
      subject,
    };
    const rs = await sendMail(data);
    return res.status(sttCode.Ok).json({
      success: true,
      mes: rs,
    });
  }
  return res.status(sttCode.NotFound).json({
    success: false,
    mes: "User not found",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  if (!token || !password) {
    throw new Error("Error");
  }
  const passwordToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordToken,
    passwordTokenExpiration: { $gt: Date.now() },
  });
  if (user) {
    user.password = password;
    user.passwordToken = "";
    user.passwordTokenExpiration = "";
    await user.save();
    return res.status(sttCode.Ok).json({
      success: true,
      mes: "Changed password success",
    });
  }
  return res.status(sttCode.NotImplemented).json({
    success: false,
    mes: "Token expired!",
  });
});

// -------------------------------

const getAllUsers = asyncHandler(async (req, res) => {
  const response = await User.find();
  return res.status(sttCode.Ok).json({
    success: response ? true : false,
    mes: response,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;
  if (!id || !_id) throw new Error("Invalid id");
  if (id === _id) {
    const user = await User.findByIdAndDelete(id);
    return res.status(sttCode.Ok).json({
      success: user ? true : false,
      mes: user ? "Deleted successfully" : "Something went wrong",
    });
  } else {
    const admin = await User.findById(_id);
    if (admin.role === "admin") {
      const user = await User.findByIdAndDelete(id);
      return res.status(sttCode.Ok).json({
        success: user ? true : false,
        mes: user ? "Deleted successfully" : "Something went wrong",
      });
    } else {
      throw new Error("You do not have permission to delete this user");
    }
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id_update } = req.params;
  if (Object.keys(req.body) === 0) throw new Error("Missing input!");
  if (_id === id_update) {
    const user = await User.findByIdAndUpdate(_id, req.body, { new: true });
    return res.status(sttCode.Ok).json({
      success: user ? true : false,
      mes: user ? "Updated successfully" : "Something went wrong",
    });
  } else {
    const user_admin = await User.findById(_id);
    if (user_admin.role === "admin") {
      const user_update = await User.findByIdAndUpdate(id_update, req.body, {
        new: true,
      });
      return res.status(sttCode.Ok).json({
        success: user_update ? true : false,
        mes: user_update ? "Updated successfully" : "Something went wrong",
      });
    } else throw new Error("You do not have permission to update this user");
  }
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Missing input!");
  const user = await User.findById(id).select("-password");
  return res.status(sttCode.Ok).json({
    success: user ? true : false,
    mes: user ? user : "Something went wrong",
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new Error("Authentication failed");
  const { password, oldPassword } = req.body;
  if (!password) throw new Error("Missing input!");
  const user = await User.findById(_id);
  if (await user.isCorrectPassword(oldPassword)) {
    user.password = password;
    user.save()
    return res.status(sttCode.Ok).json({
      success: true,
      mes: "Change password successfully",
    });
  } else {
    return res.status(sttCode.Ok).json({
      success: false,
      mes: "Password incorrect!",
    });
  }
});

const depositAccount = asyncHandler(async (req, res) => {
  const {_id} = req.user
  if (!_id) throw new Error("Authentication failed");
  const {amount} = req.body;
  if(!amount) throw new Error("Missing input");
  const user = await User.findById(_id);
  if(user) {
    user.walletBalance = user.walletBalance + amount;
    user.save();
    return res.status(sttCode.Ok).json({
      success: true,
      mes: 'Wallet balance updated successfully'
    })
  }
  throw new Error("Authentication failed");
})
module.exports = {
  register,
  login,
  getCurrent,
  refreshToken,
  forgotPassword,
  resetPassword,
  getAllUsers,
  deleteUser,
  updateUser,
  getUser,
  changePassword,
  depositAccount
};
