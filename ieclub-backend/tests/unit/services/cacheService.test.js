// tests/unit/services/cacheService.test.js
// 缓存服务单元测试

const CacheService = require('../../../src/services/cacheService');

// Mock Redis client
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  pipeline: jest.fn(),
};

jest.mock('../../../src/utils/redis', () => mockRedis);

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));
      
      const result = await CacheService.get('test:key');
      
      expect(result).toEqual(mockData);
      expect(mockRedis.get).toHaveBeenCalledWith('test:key');
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await CacheService.get('nonexistent:key');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockRedis.get.mockResolvedValue('invalid json');
      
      const result = await CacheService.get('test:key');
      
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const data = { id: 1, name: 'Test' };
      await CacheService.set('test:key', data);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify(data),
        'EX',
        3600
      );
    });

    it('should set value with custom TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const data = { id: 1, name: 'Test' };
      await CacheService.set('test:key', data, 7200);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify(data),
        'EX',
        7200
      );
    });

    it('should handle set errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));
      
      await expect(
        CacheService.set('test:key', { data: 'test' })
      ).rejects.toThrow('Redis error');
    });
  });

  describe('del', () => {
    it('should delete single key', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      const result = await CacheService.del('test:key');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test:key');
    });

    it('should delete multiple keys', async () => {
      mockRedis.del.mockResolvedValue(3);
      
      const result = await CacheService.del(['key1', 'key2', 'key3']);
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should return false if no keys deleted', async () => {
      mockRedis.del.mockResolvedValue(0);
      
      const result = await CacheService.del('nonexistent:key');
      
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const result = await CacheService.exists('test:key');
      
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('test:key');
    });

    it('should return false if key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);
      
      const result = await CacheService.exists('nonexistent:key');
      
      expect(result).toBe(false);
    });
  });

  describe('getTTL', () => {
    it('should return TTL for key', async () => {
      mockRedis.ttl.mockResolvedValue(3600);
      
      const result = await CacheService.getTTL('test:key');
      
      expect(result).toBe(3600);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test:key');
    });

    it('should return -1 for key without expiration', async () => {
      mockRedis.ttl.mockResolvedValue(-1);
      
      const result = await CacheService.getTTL('test:key');
      
      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      mockRedis.ttl.mockResolvedValue(-2);
      
      const result = await CacheService.getTTL('nonexistent:key');
      
      expect(result).toBe(-2);
    });
  });

  describe('clearPattern', () => {
    it('should clear keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['user:1', 'user:2', 'user:3']);
      mockRedis.del.mockResolvedValue(3);
      
      const result = await CacheService.clearPattern('user:*');
      
      expect(result).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('user:*');
      expect(mockRedis.del).toHaveBeenCalledWith(['user:1', 'user:2', 'user:3']);
    });

    it('should return 0 if no keys match pattern', async () => {
      mockRedis.keys.mockResolvedValue([]);
      
      const result = await CacheService.clearPattern('nonexistent:*');
      
      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('mget', () => {
    it('should get multiple values', async () => {
      const data1 = { id: 1, name: 'User 1' };
      const data2 = { id: 2, name: 'User 2' };
      
      mockRedis.mget.mockResolvedValue([
        JSON.stringify(data1),
        JSON.stringify(data2),
        null
      ]);
      
      const result = await CacheService.mget(['user:1', 'user:2', 'user:3']);
      
      expect(result).toEqual([data1, data2, null]);
      expect(mockRedis.mget).toHaveBeenCalledWith(['user:1', 'user:2', 'user:3']);
    });

    it('should handle empty key array', async () => {
      const result = await CacheService.mget([]);
      
      expect(result).toEqual([]);
      expect(mockRedis.mget).not.toHaveBeenCalled();
    });
  });

  describe('mset', () => {
    it('should set multiple values', async () => {
      const mockPipeline = {
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([['OK'], ['OK']])
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline);
      
      const data = {
        'user:1': { id: 1, name: 'User 1' },
        'user:2': { id: 2, name: 'User 2' }
      };
      
      await CacheService.mset(data, 3600);
      
      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.set).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle empty data object', async () => {
      await CacheService.mset({}, 3600);
      
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { id: 1, name: 'Cached' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));
      
      const fetchFn = jest.fn();
      const result = await CacheService.getOrSet('test:key', fetchFn);
      
      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      
      const freshData = { id: 1, name: 'Fresh' };
      const fetchFn = jest.fn().mockResolvedValue(freshData);
      
      const result = await CacheService.getOrSet('test:key', fetchFn, 3600);
      
      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify(freshData),
        'EX',
        3600
      );
    });

    it('should not cache null values', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const fetchFn = jest.fn().mockResolvedValue(null);
      
      const result = await CacheService.getOrSet('test:key', fetchFn);
      
      expect(result).toBeNull();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should not cache undefined values', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const fetchFn = jest.fn().mockResolvedValue(undefined);
      
      const result = await CacheService.getOrSet('test:key', fetchFn);
      
      expect(result).toBeUndefined();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('Cache Key Helpers', () => {
    describe('getUserCacheKey', () => {
      it('should generate user cache key', () => {
        const key = CacheService.getUserCacheKey('user123');
        expect(key).toBe('user:user123');
      });
    });

    describe('getTopicCacheKey', () => {
      it('should generate topic cache key', () => {
        const key = CacheService.getTopicCacheKey('topic456');
        expect(key).toBe('topic:topic456');
      });
    });

    describe('getActivityCacheKey', () => {
      it('should generate activity cache key', () => {
        const key = CacheService.getActivityCacheKey('activity789');
        expect(key).toBe('activity:activity789');
      });
    });

    describe('getListCacheKey', () => {
      it('should generate list cache key with params', () => {
        const key = CacheService.getListCacheKey('topics', { page: 1, category: 'tech' });
        expect(key).toContain('list:topics:');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection failed'));
      
      await expect(CacheService.get('test:key')).rejects.toThrow('Connection failed');
    });

    it('should handle serialization errors', async () => {
      const circularObj = {};
      circularObj.self = circularObj;
      
      await expect(
        CacheService.set('test:key', circularObj)
      ).rejects.toThrow();
    });
  });
});

