  const mongoose = require("mongoose");
  const bcrypt = require("bcrypt");
  const cryptoJs = require("crypto-js");
  const crypto = require("crypto");
  var userSchema = new mongoose.Schema(
    {
      avatar: {
        type: String,
        default: '/avatar_default.png'
      },
      fullname: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
        minLength: 6,
      },
      role: {
        type: String,
        default: "user",
        enum: ["admin", "user"],
      },
      favorites: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Comic",
        },
      ],
      walletBalance: {
        type: Number,
        default: 500,
      },
      address: String,
      refreshToken: {
        type: String,
      },
      passwordToken: {
        type: String,
      },
      passwordTokenExpiration: {
        type: String,
      },
      status: {
        type: String,
        enum: ['active', 'disabled']
      }
    },
    {
      timestamps: true,
    }
  );

  userSchema.pre("save", async function (next) {
    // if (this.isModified("password")) {
    //   const salt = bcrypt.genSaltSync(10);
    //   this.password = await bcrypt.hash(this.password, salt);
    // } else {
    //   next();
    // }
    const salt = bcrypt.genSaltSync(10);
    const newPassword = await bcrypt.hash(this.password, salt);
    const oldPassword = this.password;
    if(newPassword === oldPassword) {
      next();
    } else {
      this.password = newPassword;
    }

  });

  userSchema.methods = {
    isCorrectPassword: async function (password) {
      return await bcrypt.compare(password, this.password);
    },
    createPasswordToken: function () {
      const createToken = crypto.randomBytes(32).toString('hex')
      this.passwordToken = crypto.createHash('sha256').update(createToken).digest('hex');
      this.passwordTokenExpiration = Date.now() + 15 * 60 * 1000
      return createToken
    }
  };
  module.exports = mongoose.model("User", userSchema);
