const mongoose = require("mongoose");
var paymentSchema = new mongoose.Schema(
  {
    transactionID: {
      type: String,
      unique: true,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    amount: {
        type: Number,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
