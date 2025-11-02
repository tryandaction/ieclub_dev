// tests/unit/middleware/validate.test.js
// 输入验证中间件单元测试

const { body, validationResult } = require('express-validator');
const { validate, validateSingle } = require('../../../src/middleware/validate');
const AppError = require('../../../src/utils/AppError');

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn(),
  validationResult: jest.fn(),
}));

describe('Validate Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('validate', () => {
    it('should pass validation when no errors', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });
      
      const middleware = validate([mockValidation]);
      await middleware(req, res, next);
      
      expect(mockValidation.run).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return validation errors', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      const errors = [
        { path: 'email', msg: 'Invalid email', value: 'invalid' },
        { path: 'password', msg: 'Too short', value: '123' }
      ];
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });
      
      const middleware = validate([mockValidation]);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveLength(2);
    });

    it('should run multiple validations in parallel', async () => {
      const mockValidation1 = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      const mockValidation2 = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      const mockValidation3 = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });
      
      const middleware = validate([mockValidation1, mockValidation2, mockValidation3]);
      await middleware(req, res, next);
      
      expect(mockValidation1.run).toHaveBeenCalled();
      expect(mockValidation2.run).toHaveBeenCalled();
      expect(mockValidation3.run).toHaveBeenCalled();
    });

    it('should format error details correctly', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      const errors = [
        { path: 'email', msg: 'Invalid email', value: 'test@' },
        { param: 'username', msg: 'Required', value: '' }
      ];
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });
      
      const middleware = validate([mockValidation]);
      await middleware(req, res, next);
      
      const error = next.mock.calls[0][0];
      expect(error.details[0]).toEqual({
        field: 'email',
        message: 'Invalid email',
        value: 'test@'
      });
      expect(error.details[1]).toEqual({
        field: 'username',
        message: 'Required',
        value: ''
      });
    });

    it('should handle validation run errors', async () => {
      const mockValidation = {
        run: jest.fn().mockRejectedValue(new Error('Validation error'))
      };
      
      const middleware = validate([mockValidation]);
      
      await expect(middleware(req, res, next)).rejects.toThrow('Validation error');
    });
  });

  describe('validateSingle', () => {
    it('should validate single rule', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });
      
      const middleware = validateSingle(mockValidation);
      await middleware(req, res, next);
      
      expect(mockValidation.run).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith();
    });

    it('should return error for single rule', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ path: 'field', msg: 'Error', value: 'val' }]
      });
      
      const middleware = validateSingle(mockValidation);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('Integration with express-validator', () => {
    it('should work with body validation', async () => {
      const mockBodyValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      body.mockReturnValue(mockBodyValidation);
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });
      
      req.body = { email: 'test@example.com' };
      
      const middleware = validate([mockBodyValidation]);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Error Messages', () => {
    it('should use default error message', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ path: 'field', msg: 'Invalid', value: 'val' }]
      });
      
      const middleware = validate([mockValidation]);
      await middleware(req, res, next);
      
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('输入验证失败');
    });
  });

  describe('Empty Validation Array', () => {
    it('should handle empty validation array', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });
      
      const middleware = validate([]);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle nested field validation', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{
          path: 'user.email',
          msg: 'Invalid email',
          value: 'invalid'
        }]
      });
      
      const middleware = validate([mockValidation]);
      await middleware(req, res, next);
      
      const error = next.mock.calls[0][0];
      expect(error.details[0].field).toBe('user.email');
    });

    it('should handle array field validation', async () => {
      const mockValidation = {
        run: jest.fn().mockResolvedValue(undefined)
      };
      
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{
          path: 'tags[0]',
          msg: 'Invalid tag',
          value: ''
        }]
      });
      
      const middleware = validate([mockValidation]);
      await middleware(req, res, next);
      
      const error = next.mock.calls[0][0];
      expect(error.details[0].field).toBe('tags[0]');
    });
  });
});

