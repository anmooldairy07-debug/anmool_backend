const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    cancelReason: { type: String, default: "" },
    hiddenByUser: { type: Boolean, default: false },
    deliveryDate: { type: String, default: "" },
    deliveryTime: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["coins", "cod"], required: true },
    shippingAddress: { type: String, required: true },
    phone: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
