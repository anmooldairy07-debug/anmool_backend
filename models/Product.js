const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    longDescription: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "/images/placeholder.jpg" },
    category: {
      type: String,
      required: true,
      enum: ["Ghee", "Milk", "Paneer", "Curd", "Butter", "Beverages", "Eco Products"],
    },
    weight: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    features: [String],
    badge: { type: String, enum: ["bestseller", "new", "organic", "premium", null], default: null },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
