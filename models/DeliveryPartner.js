const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true, trim: true, unique: true },
    timeSlots: {
      type: [String],
      enum: ["morning", "evening"],
      default: [],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one time slot is required",
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliveryPartnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

deliveryPartnerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

deliveryPartnerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
