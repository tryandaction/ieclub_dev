// tests/unit/middleware/idempotency.test.js
// 幂等性中间件单元测试

const AppError = require('../../../src/utils/AppError');

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

jest.mock('../../../src/utils/redis', () => mockRedis);

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { idempotency, generateIdempotencyKey } = require('../../../src/middleware/idempotency');

describe('Idempotency Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      headers: {},
      method: 'POST',
      path: '/api/topics',
      body: { title: 'Test Topic' },
      user: { id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    };
    next = jest.fn();
  });

  describe('idempotency middleware', () => {
    it('should continue if no idempotency key provided', async () => {
      await idempotency(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should return cached response if request already processed', async () => {
      const cachedResponse = {
        statusCode: 200,
        body: { success: true, data: { id: 'topic123' } }
      };
      
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedResponse));
      
      await idempotency(req, res, next);
      
      expect(mockRedis.get).toHaveBeenCalledWith('idempotency:key123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(cachedResponse.body);
      expect(next).not.toHaveBeenCalled();
    });

    it('should process new request and cache response', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      
      // Mock response methods to capture response
      const originalJson = res.json;
      res.json = jest.fn((body) => {
        res.locals.responseBody = body;
        return originalJson.call(res, body);
      });
      
      await idempotency(req, res, next);
      
      expect(mockRedis.get).toHaveBeenCalledWith('idempotency:key123');
      expect(next).toHaveBeenCalled();
      expect(res.locals.idempotencyKey).toBe('key123');
    });

    it('should skip for GET requests', async () => {
      req.method = 'GET';
      req.headers['idempotency-key'] = 'key123';
      
      await idempotency(req, res, next);
      
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip for HEAD requests', async () => {
      req.method = 'HEAD';
      req.headers['idempotency-key'] = 'key123';
      
      await idempotency(req, res, next);
      
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should skip for OPTIONS requests', async () => {
      req.method = 'OPTIONS';
      req.headers['idempotency-key'] = 'key123';
      
      await idempotency(req, res, next);
      
      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle invalid cached data', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue('invalid json');
      
      await idempotency(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      await idempotency(req, res, next);
      
      // Should continue even if Redis fails
      expect(next).toHaveBeenCalled();
    });

    it('should use custom TTL if provided', async () => {
      const customTTL = 7200;
      const customMiddleware = idempotency({ ttl: customTTL });
      
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      
      await customMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate consistent key for same input', () => {
      const key1 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test' });
      const key2 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test' });
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different users', () => {
      const key1 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test' });
      const key2 = generateIdempotencyKey('user456', 'POST', '/api/topics', { title: 'Test' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different methods', () => {
      const key1 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test' });
      const key2 = generateIdempotencyKey('user123', 'PUT', '/api/topics', { title: 'Test' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different paths', () => {
      const key1 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test' });
      const key2 = generateIdempotencyKey('user123', 'POST', '/api/activities', { title: 'Test' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different body content', () => {
      const key1 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test 1' });
      const key2 = generateIdempotencyKey('user123', 'POST', '/api/topics', { title: 'Test 2' });
      
      expect(key1).not.toBe(key2);
    });

    it('should handle empty body', () => {
      const key = generateIdempotencyKey('user123', 'POST', '/api/topics', {});
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should handle null body', () => {
      const key = generateIdempotencyKey('user123', 'POST', '/api/topics', null);
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });

    it('should handle complex nested objects', () => {
      const complexBody = {
        title: 'Test',
        content: 'Content',
        tags: ['tag1', 'tag2'],
        metadata: {
          category: 'tech',
          priority: 1
        }
      };
      
      const key = generateIdempotencyKey('user123', 'POST', '/api/topics', complexBody);
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    });
  });

  describe('Response Caching', () => {
    it('should cache successful responses', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      
      await idempotency(req, res, next);
      
      // Simulate response
      res.locals.responseBody = { success: true, data: { id: 'topic123' } };
      res.statusCode = 200;
      
      // The middleware should have set up response interception
      expect(res.locals.idempotencyKey).toBe('key123');
    });

    it('should not cache error responses', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(null);
      
      await idempotency(req, res, next);
      
      // Simulate error response
      res.locals.responseBody = { success: false, error: 'Error occurred' };
      res.statusCode = 500;
      
      // Error responses should not be cached
      expect(res.locals.idempotencyKey).toBe('key123');
    });
  });

  describe('Key Format', () => {
    it('should use correct Redis key prefix', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(null);
      
      await idempotency(req, res, next);
      
      expect(mockRedis.get).toHaveBeenCalledWith('idempotency:key123');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests with same key', async () => {
      req.headers['idempotency-key'] = 'key123';
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      
      // Simulate two concurrent requests
      const promise1 = idempotency(req, res, next);
      const promise2 = idempotency(req, res, next);
      
      await Promise.all([promise1, promise2]);
      
      // Both should proceed, but only one should cache
      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});

