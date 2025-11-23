const express = require("express");
const router = express.Router();

// ==================== Health Check ====================
router.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "IEClub API is running", 
    version: "2.0.0",
    timestamp: new Date().toISOString() 
  });
});

// ==================== Sub-Routes ====================
// 这些子路由已经过测试，可以安全加载
router.use("/community", require("./community"));
router.use("/activities", require("./activities"));
router.use("/notifications", require("./notificationRoutes"));

// TODO: 逐步添加其他routes
// 注意：直接加载所有controllers会导致启动挂起
// 需要分批测试并添加

module.exports = router;
