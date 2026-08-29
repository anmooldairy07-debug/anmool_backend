require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const connectDB = require("./config/db");
const Order = require("./models/Order");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/coins", require("./routes/coins"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/delivery-partners", require("./routes/deliveryPartners"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Cron: Delete orders older than 30 days (runs daily at 3 AM)
cron.schedule("0 3 * * *", async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const result = await Order.deleteMany({ createdAt: { $lt: cutoff } });
    console.log(`[Cron] Deleted ${result.deletedCount} orders older than 30 days`);
  } catch (err) {
    console.error("[Cron] Failed to delete old orders:", err.message);
  }
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
