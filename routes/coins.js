const express = require("express");
const User = require("../models/User");
const CoinPackage = require("../models/CoinPackage");
const { auth } = require("../middleware/auth");

const router = express.Router();

// GET /api/coins/packages — public
router.get("/packages", async (req, res) => {
  try {
    const packages = await CoinPackage.find().sort({ price: 1 });
    res.json({ packages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/coins/balance — auth
router.get("/balance", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ coins: user.coins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/coins/buy — auth (simulated purchase, admin blocked)
router.post("/buy", auth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admin cannot buy coins" });
    }
    const { packageId } = req.body;
    const pkg = await CoinPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: "Package not found" });

    const user = await User.findById(req.user._id);
    user.coins += pkg.coins + pkg.bonus;
    await user.save();

    res.json({ coins: user.coins, added: pkg.coins + pkg.bonus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
