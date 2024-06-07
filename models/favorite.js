const mongoose = require("mongoose");
var favoriteSchema = new mongoose.Schema(
  {
    comic: {
        type: mongoose.Types.ObjectId,
        ref: "Comic"
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Favorite", favoriteSchema);
