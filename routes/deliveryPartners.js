const express = require("express");
const jwt = require("jsonwebtoken");
const DeliveryPartner = require("../models/DeliveryPartner");
const User = require("../models/User");
const Order = require("../models/Order");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id, role: "delivery_partner" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Delivery Partner Auth Middleware
const dpAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const partner = await DeliveryPartner.findById(decoded.id).select("-password");
    if (!partner) return res.status(401).json({ message: "Token is not valid" });
    req.partner = partner;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// POST /api/delivery-partners/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await partner.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!partner.active) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact admin." });
    }

    const token = generateToken(partner._id);
    res.json({ token, partner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/delivery-partners/me
router.get("/me", dpAuth, async (req, res) => {
  res.json({ partner: req.partner });
});

// GET /api/delivery-partners/my-orders — orders assigned to this partner
router.get("/my-orders", dpAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { assignedTo: req.partner._id, status: { $nin: ["cancelled"] } };
    if (date) filter.deliveryDate = date;
    const orders = await Order.find(filter)
      .populate("user", "name email phone avatar address")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/delivery-partners/my-summary — product summary for assigned orders
router.get("/my-summary", dpAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { assignedTo: req.partner._id, status: { $nin: ["cancelled"] } };
    if (date) filter.deliveryDate = date;
    const orders = await Order.find(filter).populate("user", "name email phone");
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

// PUT /api/delivery-partners/orders/:id/status — partner updates order status
router.put("/orders/:id/status", dpAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["out_for_delivery", "delivered"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await Order.findOne({ _id: req.params.id, assignedTo: req.partner._id });
    if (!order) return res.status(404).json({ message: "Order not found or not assigned to you" });
    order.status = status;
    await order.save();
    const populated = await Order.findById(order._id).populate("user", "name email phone avatar address");
    res.json({ order: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin Routes ───

// GET /api/delivery-partners — list all partners (admin)
router.get("/", auth, admin, async (req, res) => {
  try {
    const partners = await DeliveryPartner.find().sort({ createdAt: -1 });
    res.json({ partners });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/delivery-partners — create partner (admin)
router.post("/", auth, admin, async (req, res) => {
  try {
    const { name, email, password, phone, timeSlots } = req.body;
    if (!name || !email || !password || !phone || !timeSlots?.length) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const dpEmailExists = await DeliveryPartner.findOne({ email });
    if (dpEmailExists) return res.status(400).json({ message: "Email already registered" });
    const userEmailExists = await User.findOne({ email });
    if (userEmailExists) return res.status(400).json({ message: "Email already registered" });
    const dpPhoneExists = await DeliveryPartner.findOne({ phone });
    if (dpPhoneExists) return res.status(400).json({ message: "Phone number already registered" });
    const userPhoneExists = await User.findOne({ phone });
    if (userPhoneExists) return res.status(400).json({ message: "Phone number already registered" });
    const partner = await DeliveryPartner.create({ name, email, password, phone, timeSlots });
    res.status(201).json({ partner });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/delivery-partners/:id — update partner (admin)
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const { name, phone, timeSlots, active } = req.body;
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: "Partner not found" });
    if (name) partner.name = name;
    if (phone) partner.phone = phone;
    if (timeSlots) partner.timeSlots = timeSlots;
    if (typeof active === "boolean") partner.active = active;
    await partner.save();
    res.json({ partner });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/delivery-partners/:id — delete partner (admin)
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    await DeliveryPartner.findByIdAndDelete(req.params.id);
    res.json({ message: "Partner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/delivery-partners/assign-orders — distribute orders to partners (admin)
router.post("/assign-orders", auth, admin, async (req, res) => {
  try {
    const { date } = req.body;
    const deliveryDate = date || new Date().toISOString().split("T")[0];

    // Find unassigned orders for the given date
    const orders = await Order.find({
      deliveryDate,
      assignedTo: null,
      status: "pending",
    });

    if (orders.length === 0) {
      return res.json({ message: "No unassigned orders found", assigned: 0 });
    }

    // Group orders by delivery time slot
    const morningOrders = orders.filter((o) => o.deliveryTime === "morning");
    const eveningOrders = orders.filter((o) => o.deliveryTime === "evening");

    // Get active partners grouped by time slot availability
    const partners = await DeliveryPartner.find({ active: true });
    const morningPartners = partners.filter((p) => p.timeSlots.includes("morning"));
    const eveningPartners = partners.filter((p) => p.timeSlots.includes("evening"));

    // Count existing assignments per partner for this date to distribute evenly
    const existingAssignments = await Order.aggregate([
      { $match: { deliveryDate, assignedTo: { $ne: null }, status: { $nin: ["cancelled"] } } },
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
    ]);
    const assignmentCounts = {};
    for (const a of existingAssignments) {
      assignmentCounts[a._id.toString()] = a.count;
    }

    let assignedCount = 0;

    // Distribute morning orders — pick partner with fewest existing assignments
    if (morningOrders.length > 0 && morningPartners.length > 0) {
      for (const order of morningOrders) {
        morningPartners.sort((a, b) => (assignmentCounts[a._id.toString()] || 0) - (assignmentCounts[b._id.toString()] || 0));
        const partner = morningPartners[0];
        order.assignedTo = partner._id;
        order.status = "confirmed";
        await order.save();
        assignmentCounts[partner._id.toString()] = (assignmentCounts[partner._id.toString()] || 0) + 1;
        assignedCount++;
      }
    }

    // Distribute evening orders — pick partner with fewest existing assignments
    if (eveningOrders.length > 0 && eveningPartners.length > 0) {
      for (const order of eveningOrders) {
        eveningPartners.sort((a, b) => (assignmentCounts[a._id.toString()] || 0) - (assignmentCounts[b._id.toString()] || 0));
        const partner = eveningPartners[0];
        order.assignedTo = partner._id;
        order.status = "confirmed";
        await order.save();
        assignmentCounts[partner._id.toString()] = (assignmentCounts[partner._id.toString()] || 0) + 1;
        assignedCount++;
      }
    }

    res.json({ message: `Assigned ${assignedCount} orders`, assigned: assignedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
