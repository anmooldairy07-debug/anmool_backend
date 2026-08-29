const mongoose = require("mongoose");

const coinPackageSchema = new mongoose.Schema(
  {
    coins: { type: Number, required: true },
    price: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoinPackage", coinPackageSchema);
