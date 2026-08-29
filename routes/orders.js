const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { auth, admin } = require("../middleware/auth");
const { sendMail, orderCancelledEmail } = require("../utils/email");

const router = express.Router();

// POST /api/orders — auth required (admin blocked)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin cannot place orders" });
    }
    const { items, total, paymentMethod, shippingAddress, phone, deliveryDate, deliveryTime } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: "No items in order" });
    if (!shippingAddress || !phone) return res.status(400).json({ message: "Address and phone required" });

    const productIds = items.map((i) => i.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    if (dbProducts.length !== productIds.length) {
      return res.status(400).json({ message: "Some products not found" });
    }

    if (paymentMethod === "coins") {
      const user = await User.findById(req.user._id);
      if (user.coins < total) {
        return res.status(400).json({ message: "Insufficient coins" });
      }
      user.coins -= total;
      await user.save();
    }

    const orderItems = items.map((item) => {
      const p = dbProducts.find((dp) => dp._id.toString() === item.product);
      return { product: p._id, name: p.name, price: p.price, quantity: item.quantity };
    });

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
      paymentMethod,
      shippingAddress,
      phone,
      deliveryDate: deliveryDate || "",
      deliveryTime: deliveryTime || "",
    });

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders — user's own orders (excludes hidden)
router.get("/", auth, async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : { user: req.user._id, hiddenByUser: { $ne: true } };
    const orders = await Order.find(filter)
      .populate("user", "name email phone avatar")
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email phone avatar").populate("assignedTo", "name phone");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status — admin (sends email on cancellation)
router.put("/:id/status", auth, admin, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const update = { status };
    if (status === "cancelled" && cancelReason) {
      update.cancelReason = cancelReason;
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("user", "name email phone avatar")
      .populate("assignedTo", "name phone");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Send cancellation email
    if (status === "cancelled" && order.user.email) {
      const email = orderCancelledEmail(order.user.name, order._id.toString(), cancelReason || "");
      sendMail({ to: order.user.email, subject: email.subject, html: email.html }).catch(() => {});
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/hide — user hides delivered/cancelled order from their view
router.put("/:id/hide", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (order.status !== "delivered" && order.status !== "cancelled") {
      return res.status(400).json({ message: "Can only hide delivered or cancelled orders" });
    }
    order.hiddenByUser = true;
    await order.save();
    res.json({ message: "Order removed from your records" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/orders/:id — user cancels their own pending order
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Can only cancel pending orders" });
    }
    if (order.paymentMethod === "coins") {
      await User.findByIdAndUpdate(order.user, { $inc: { coins: order.total } });
    }
    order.status = "cancelled";
    await order.save();
    res.json({ message: "Order cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
