const express = require("express");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const CoinPackage = require("../models/CoinPackage");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

// GET /api/admin/dashboard — admin stats
router.get("/dashboard", auth, admin, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, pendingOrders, deliveredOrders, revenue] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        Order.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "delivered" }),
        Order.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
      ]);

    const recentOrders = await Order.find()
      .populate("user", "name email phone avatar")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      totalRevenue: revenue[0]?.total || 0,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users — all users
router.get("/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/orders — all orders (supports date & timeSlot filtering)
router.get("/orders", auth, admin, async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    const filter = {};
    if (date) filter.deliveryDate = date;
    if (timeSlot) filter.deliveryTime = timeSlot;
    const orders = await Order.find(filter)
      .populate("user", "name email phone avatar")
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/orders/today — today's orders grouped by time slot
router.get("/orders/today", auth, admin, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const orders = await Order.find({ deliveryDate: today })
      .populate("user", "name email phone avatar")
      .sort({ createdAt: -1 });
    const morning = orders.filter((o) => o.deliveryTime === "morning");
    const evening = orders.filter((o) => o.deliveryTime === "evening");
    const unscheduled = orders.filter((o) => o.deliveryTime !== "morning" && o.deliveryTime !== "evening");
    res.json({ today, morning, evening, unscheduled, total: orders.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/orders/product-summary — aggregated product quantities for a date/slot
router.get("/orders/product-summary", auth, admin, async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    const filter = { status: { $nin: ["cancelled"] } };
    if (date) filter.deliveryDate = date;
    if (timeSlot) filter.deliveryTime = timeSlot;
    const orders = await Order.find(filter).populate("user", "name email phone avatar");
    const productMap = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.product.toString();
        if (!productMap[key]) {
          productMap[key] = { productId: key, name: item.name, totalQuantity: 0, totalAmount: 0, orderCount: 0 };
        }
        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalAmount += item.price * item.quantity;
        productMap[key].orderCount += 1;
      }
    }
    const summary = Object.values(productMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
    res.json({ summary, totalOrders: orders.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/coin-packages
router.get("/coin-packages", auth, admin, async (req, res) => {
  try {
    const packages = await CoinPackage.find().sort({ price: 1 });
    res.json({ packages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/coin-packages — create package
router.post("/coin-packages", auth, admin, async (req, res) => {
  try {
    const pkg = await CoinPackage.create(req.body);
    res.status(201).json({ package: pkg });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/coin-packages/:id
router.delete("/coin-packages/:id", auth, admin, async (req, res) => {
  try {
    await CoinPackage.findByIdAndDelete(req.params.id);
    res.json({ message: "Package deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
