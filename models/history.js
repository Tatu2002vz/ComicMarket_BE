const mongoose = require("mongoose");
var historySchema = new mongoose.Schema(
  {
    comic: {
        type: mongoose.Types.ObjectId,
        ref: "Comic"
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    chapter: {
        type: mongoose.Types.ObjectId,
        ref: "Chapter"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("History", historySchema);
