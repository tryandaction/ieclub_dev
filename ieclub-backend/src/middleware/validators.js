// src/middleware/validators.js
// 常用的验证规则集合

const { body, param, query } = require('express-validator');
const { checkEmailAllowed } = require('../utils/emailDomainChecker');

// ==================== 用户相关验证 ====================

/**
 * 发送验证码验证
 */
const sendVerifyCodeValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .custom(async (email, { req }) => {
      const type = req.body.type || 'register';
      const emailCheck = await checkEmailAllowed(email, type);
      if (!emailCheck.valid) {
        throw new Error(emailCheck.message);
      }
      return true;
    }),
  
  body('type')
    .optional()
    .isIn(['register', 'reset', 'login']).withMessage('验证码类型无效')
];

/**
 * 注册验证
 */
const registerValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .custom(async (email) => {
      const emailCheck = await checkEmailAllowed(email, 'register');
      if (!emailCheck.valid) {
        throw new Error(emailCheck.message);
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8, max: 32 }).withMessage('密码长度必须在8-32个字符之间')
    .matches(/[a-zA-Z]/).withMessage('密码必须包含字母')
    .matches(/\d/).withMessage('密码必须包含数字'),
  
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 }).withMessage('昵称长度必须在2-20个字符之间')
    .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/).withMessage('昵称只能包含中文、字母、数字和下划线'),
  
  body('verifyCode')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字')
    .isNumeric().withMessage('验证码只能包含数字'),
  
  body('gender')
    .optional()
    .isInt({ min: 0, max: 2 }).withMessage('性别参数无效')
];

/**
 * 登录验证
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .custom(async (email) => {
      const emailCheck = await checkEmailAllowed(email, 'login');
      if (!emailCheck.valid) {
        throw new Error(emailCheck.message);
      }
      return true;
    }),
  
  body('password')
    .notEmpty().withMessage('密码不能为空')
];

/**
 * 更新个人资料验证
 */
const updateProfileValidation = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 }).withMessage('昵称长度必须在2-20个字符之间')
    .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/).withMessage('昵称只能包含中文、字母、数字和下划线'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('个人简介不能超过500个字符'),
  
  body('gender')
    .optional()
    .isInt({ min: 0, max: 2 }).withMessage('性别参数无效'),
  
  body('avatar')
    .optional()
    .trim()
    .isURL().withMessage('头像链接格式不正确'),
  
  body('major')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('专业名称不能超过100个字符'),
  
  body('grade')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('年级信息不能超过20个字符'),
  
  body('school')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('学校名称不能超过100个字符'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
];

// ==================== 话题相关验证 ====================

/**
 * 创建话题验证
 */
const createTopicValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('标题长度必须在5-200个字符之间')
    .notEmpty().withMessage('标题不能为空'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 10000 }).withMessage('内容长度必须在10-10000个字符之间')
    .notEmpty().withMessage('内容不能为空'),
  
  body('category')
    .trim()
    .isIn(['技术', '创业', '活动', '招聘', '分享', '提问', '其他'])
    .withMessage('请选择有效的分类'),
  
  body('topicType')
    .optional()
    .isIn(['discussion', 'question', 'share', 'announcement'])
    .withMessage('话题类型无效'),
  
  body('tags')
    .optional()
    .isArray({ max: 5 }).withMessage('标签最多5个')
    .custom((tags) => {
      return tags.every(tag => typeof tag === 'string' && tag.length <= 20);
    }).withMessage('每个标签长度不能超过20个字符'),
  
  body('images')
    .optional()
    .isArray({ max: 9 }).withMessage('图片最多9张'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'followers']).withMessage('可见性参数无效')
];

/**
 * 更新话题验证
 */
const updateTopicValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('话题ID不能为空'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('标题长度必须在5-200个字符之间'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10000 }).withMessage('内容长度必须在10-10000个字符之间'),
  
  body('category')
    .optional()
    .isIn(['技术', '创业', '活动', '招聘', '分享', '提问', '其他'])
    .withMessage('请选择有效的分类')
];

// ==================== 活动相关验证 ====================

/**
 * 创建活动验证
 */
const createActivityValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('活动标题长度必须在5-200个字符之间')
    .notEmpty().withMessage('活动标题不能为空'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 }).withMessage('活动描述长度必须在20-5000个字符之间')
    .notEmpty().withMessage('活动描述不能为空'),
  
  body('location')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('活动地点长度必须在2-200个字符之间')
    .notEmpty().withMessage('活动地点不能为空'),
  
  body('startTime')
    .isISO8601().withMessage('开始时间格式无效')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('开始时间必须晚于当前时间');
      }
      return true;
    }),
  
  body('endTime')
    .optional()
    .isISO8601().withMessage('结束时间格式无效')
    .custom((value, { req }) => {
      if (value && req.body.startTime) {
        const startTime = new Date(req.body.startTime);
        const endTime = new Date(value);
        if (endTime <= startTime) {
          throw new Error('结束时间必须晚于开始时间');
        }
      }
      return true;
    }),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 10000 }).withMessage('参与人数限制必须在1-10000之间'),
  
  body('category')
    .trim()
    .isIn(['讲座', '工作坊', '社交', '竞赛', '志愿', '其他'])
    .withMessage('请选择有效的活动分类')
];

// ==================== 评论相关验证 ====================

/**
 * 创建评论验证
 */
const createCommentValidation = [
  body('topicId')
    .trim()
    .notEmpty().withMessage('话题ID不能为空'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('评论内容长度必须在1-1000个字符之间')
    .notEmpty().withMessage('评论内容不能为空'),
  
  body('parentId')
    .optional()
    .trim(),
  
  body('images')
    .optional()
    .isArray({ max: 3 }).withMessage('评论图片最多3张')
];

// ==================== 搜索相关验证 ====================

/**
 * 搜索验证
 */
const searchValidation = [
  query('keyword')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('搜索关键词长度必须在1-100个字符之间'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['hot', 'new', 'trending']).withMessage('排序方式无效')
];

// ==================== 分页验证 ====================

/**
 * 分页参数验证
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('页码必须是大于0的整数')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
    .toInt()
];

// ==================== ID 参数验证 ====================

/**
 * ID 参数验证
 */
const idParamValidation = [
  param('id')
    .trim()
    .notEmpty().withMessage('ID不能为空')
];

module.exports = {
  // 用户相关
  sendVerifyCodeValidation,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  
  // 话题相关
  createTopicValidation,
  updateTopicValidation,
  
  // 活动相关
  createActivityValidation,
  
  // 评论相关
  createCommentValidation,
  
  // 搜索相关
  searchValidation,
  
  // 通用
  paginationValidation,
  idParamValidation
};

