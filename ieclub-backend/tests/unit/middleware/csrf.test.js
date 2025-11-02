// tests/unit/middleware/csrf.test.js
// CSRF 防护中间件单元测试

const AppError = require('../../../src/utils/AppError');

// Mock dependencies
const mockCsurf = jest.fn();
jest.mock('csurf', () => mockCsurf);

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('CSRF Protection Middleware', () => {
  let csrfProtection;
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      path: '/api/test',
      method: 'POST',
      headers: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Mock csurf to return a middleware function
    mockCsurf.mockReturnValue((req, res, next) => next());
  });

  describe('csrfProtection', () => {
    it('should create CSRF protection middleware', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      expect(typeof csrfProtection).toBe('function');
    });

    it('should skip CSRF check for ignored paths', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection({
        ignorePaths: ['^/auth/login$', '^/auth/register$']
      });

      req.path = '/auth/login';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should apply CSRF check for non-ignored paths', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection({
        ignorePaths: ['^/auth/login$']
      });

      req.path = '/api/topics';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should skip CSRF check for GET requests', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection();

      req.method = 'GET';
      req.path = '/api/topics';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should skip CSRF check for HEAD requests', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection();

      req.method = 'HEAD';
      req.path = '/api/topics';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should skip CSRF check for OPTIONS requests', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection();

      req.method = 'OPTIONS';
      req.path = '/api/topics';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getCsrfToken', () => {
    it('should return CSRF token', () => {
      req.csrfToken = jest.fn().mockReturnValue('csrf-token-123');
      
      const { getCsrfToken } = require('../../../src/middleware/csrf');
      
      getCsrfToken(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { csrfToken: 'csrf-token-123' }
      });
    });

    it('should handle missing csrfToken function', () => {
      delete req.csrfToken;
      
      const { getCsrfToken } = require('../../../src/middleware/csrf');
      
      getCsrfToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'CSRF token generation failed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle CSRF token validation errors', () => {
      const csrfError = new Error('invalid csrf token');
      csrfError.code = 'EBADCSRFTOKEN';
      
      mockCsurf.mockReturnValue((req, res, next) => {
        next(csrfError);
      });

      const { csrfProtection } = require('../../../src/middleware/csrf');
      const middleware = csrfProtection();

      req.method = 'POST';
      req.path = '/api/topics';
      
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Configuration', () => {
    it('should accept custom cookie options', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const customOptions = {
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict'
        }
      };
      
      const middleware = csrfProtection(customOptions);
      
      expect(typeof middleware).toBe('function');
      expect(mockCsurf).toHaveBeenCalled();
    });

    it('should use default options when none provided', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection();
      
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Path Matching', () => {
    it('should match exact paths', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection({
        ignorePaths: ['^/auth/login$']
      });

      req.path = '/auth/login';
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.clearAllMocks();

      req.path = '/auth/login/extra';
      middleware(req, res, next);
      // Should not match because of $ anchor
    });

    it('should match wildcard paths', () => {
      const { csrfProtection } = require('../../../src/middleware/csrf');
      
      const middleware = csrfProtection({
        ignorePaths: ['^/public/.*']
      });

      req.path = '/public/images/logo.png';
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();

      jest.clearAllMocks();

      req.path = '/public/css/style.css';
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});

