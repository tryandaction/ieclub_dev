const express = require("express");
const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ success: true, message: "IE club API is running", timestamp: new Date().toISOString() });
});

// Sub-routes only
router.use("/community", require("./community"));
router.use("/activities", require("./activities"));
router.use("/notifications", require("./notificationRoutes"));

module.exports = router;
