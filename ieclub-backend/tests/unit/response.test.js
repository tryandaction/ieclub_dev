const response = require('../../src/utils/response');

describe('Response Utils', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('应该返回成功的响应', () => {
      const data = { id: 1, name: 'test' };
      const message = '操作成功';

      response.success(mockRes, data, message);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message,
        data,
        timestamp: expect.any(Number),
      });
    });

    it('应该处理空数据', () => {
      response.success(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message: '操作成功',
        data: null,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('error', () => {
    it('应该返回错误响应', () => {
      const message = '操作失败';
      const code = 400;

      response.error(mockRes, message, code);

      expect(mockRes.status).toHaveBeenCalledWith(code);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code,
        message,
        errors: null,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('serverError', () => {
    it('应该返回服务器错误响应', () => {
      response.serverError(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        code: 500,
        message: '服务器内部错误',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('paginated', () => {
    it('应该返回分页响应', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 50,
      };

      response.paginated(mockRes, data, pagination);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        code: 200,
        message: '获取成功',
        data,
        pagination,
        timestamp: expect.any(Number),
      });
    });
  });
});