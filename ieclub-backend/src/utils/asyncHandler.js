// ieclub-backend/src/utils/asyncHandler.js - 异步错误捕获工具
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;