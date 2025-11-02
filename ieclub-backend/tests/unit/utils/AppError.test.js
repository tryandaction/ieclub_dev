// tests/unit/utils/AppError.test.js
// AppError 类单元测试

const AppError = require('../../../src/utils/AppError');

describe('AppError Class', () => {
  describe('Constructor', () => {
    it('should create error with default values', () => {
      const error = new AppError('TEST_ERROR', 'Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom status code', () => {
      const error = new AppError('NOT_FOUND', 'Resource not found', 404);
      
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create error with details', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new AppError('VALIDATION_ERROR', 'Validation failed', 400, details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('Static Factory Methods', () => {
    describe('BadRequest', () => {
      it('should create 400 error', () => {
        const error = AppError.BadRequest('Invalid input');
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.message).toBe('Invalid input');
      });

      it('should include details', () => {
        const details = { errors: ['field1', 'field2'] };
        const error = AppError.BadRequest('Invalid input', details);
        
        expect(error.details).toEqual(details);
      });
    });

    describe('Unauthorized', () => {
      it('should create 401 error with default message', () => {
        const error = AppError.Unauthorized();
        
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('未授权访问');
      });

      it('should create 401 error with custom message', () => {
        const error = AppError.Unauthorized('Invalid token');
        
        expect(error.message).toBe('Invalid token');
      });
    });

    describe('Forbidden', () => {
      it('should create 403 error', () => {
        const error = AppError.Forbidden('Access denied');
        
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toBe('Access denied');
      });
    });

    describe('NotFound', () => {
      it('should create 404 error with default message', () => {
        const error = AppError.NotFound();
        
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('资源不存在');
      });

      it('should create 404 error with resource name', () => {
        const error = AppError.NotFound('用户');
        
        expect(error.message).toBe('用户不存在');
      });
    });

    describe('ValidationError', () => {
      it('should create validation error', () => {
        const details = [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' }
        ];
        const error = AppError.ValidationError('Validation failed', details);
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual(details);
      });
    });

    describe('Conflict', () => {
      it('should create 409 error', () => {
        const error = AppError.Conflict('Resource already exists');
        
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
        expect(error.message).toBe('Resource already exists');
      });
    });

    describe('TooManyRequests', () => {
      it('should create 429 error', () => {
        const error = AppError.TooManyRequests('Rate limit exceeded');
        
        expect(error.statusCode).toBe(429);
        expect(error.code).toBe('TOO_MANY_REQUESTS');
        expect(error.message).toBe('Rate limit exceeded');
      });
    });

    describe('InternalError', () => {
      it('should create 500 error', () => {
        const error = AppError.InternalError('Database connection failed');
        
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('INTERNAL_ERROR');
        expect(error.message).toBe('Database connection failed');
      });
    });
  });

  describe('Business Error Methods', () => {
    describe('UserNotFound', () => {
      it('should create user not found error', () => {
        const error = AppError.UserNotFound();
        
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('USER_NOT_FOUND');
        expect(error.message).toBe('用户不存在');
      });
    });

    describe('TopicNotFound', () => {
      it('should create topic not found error', () => {
        const error = AppError.TopicNotFound();
        
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('TOPIC_NOT_FOUND');
        expect(error.message).toBe('话题不存在');
      });
    });

    describe('ActivityNotFound', () => {
      it('should create activity not found error', () => {
        const error = AppError.ActivityNotFound();
        
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('ACTIVITY_NOT_FOUND');
        expect(error.message).toBe('活动不存在');
      });
    });

    describe('ActivityFull', () => {
      it('should create activity full error', () => {
        const error = AppError.ActivityFull();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('ACTIVITY_FULL');
        expect(error.message).toBe('活动名额已满');
      });
    });

    describe('AlreadyJoined', () => {
      it('should create already joined error', () => {
        const error = AppError.AlreadyJoined();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('ALREADY_JOINED');
        expect(error.message).toBe('已经报名该活动');
      });
    });

    describe('AlreadyLiked', () => {
      it('should create already liked error', () => {
        const error = AppError.AlreadyLiked();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('ALREADY_LIKED');
        expect(error.message).toBe('已经点赞');
      });
    });

    describe('NotLiked', () => {
      it('should create not liked error', () => {
        const error = AppError.NotLiked();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('NOT_LIKED');
        expect(error.message).toBe('还未点赞');
      });
    });

    describe('InsufficientCredits', () => {
      it('should create insufficient credits error', () => {
        const error = AppError.InsufficientCredits();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('INSUFFICIENT_CREDITS');
        expect(error.message).toBe('积分不足');
      });
    });

    describe('DuplicateCheckIn', () => {
      it('should create duplicate check-in error', () => {
        const error = AppError.DuplicateCheckIn();
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('DUPLICATE_CHECKIN');
        expect(error.message).toBe('今日已签到');
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new AppError('TEST_ERROR', 'Test message', 400, { field: 'test' });
      const json = error.toJSON();
      
      expect(json).toEqual({
        success: false,
        code: 'TEST_ERROR',
        message: 'Test message',
        statusCode: 400,
        details: { field: 'test' }
      });
    });

    it('should serialize error without details', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      const json = error.toJSON();
      
      expect(json.details).toBeUndefined();
    });
  });

  describe('Error Stack Trace', () => {
    it('should capture stack trace', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('Error Inheritance', () => {
    it('should be instance of Error', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should have correct name property', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      
      expect(error.name).toBe('AppError');
    });
  });

  describe('Operational Flag', () => {
    it('should mark error as operational', () => {
      const error = new AppError('TEST_ERROR', 'Test message');
      
      expect(error.isOperational).toBe(true);
    });
  });
});

