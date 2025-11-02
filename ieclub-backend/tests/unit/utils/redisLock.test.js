// tests/unit/utils/redisLock.test.js
// Redis 分布式锁单元测试

const RedisLock = require('../../../src/utils/redisLock');

// Mock Redis client
const mockRedis = {
  set: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  exists: jest.fn(),
};

jest.mock('../../../src/utils/redis', () => mockRedis);

describe('RedisLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('acquire', () => {
    it('should acquire lock successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const lock = await RedisLock.acquire('test:lock', 5000);
      
      expect(lock).toBeDefined();
      expect(lock.key).toBe('lock:test:lock');
      expect(lock.value).toBeDefined();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'lock:test:lock',
        expect.any(String),
        'PX',
        5000,
        'NX'
      );
    });

    it('should return null when lock is already held', async () => {
      mockRedis.set.mockResolvedValue(null);
      
      const lock = await RedisLock.acquire('test:lock', 5000, 0);
      
      expect(lock).toBeNull();
    });

    it('should retry acquiring lock', async () => {
      mockRedis.set
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('OK');
      
      const promise = RedisLock.acquire('test:lock', 5000, 3, 100);
      
      // 快进时间以触发重试
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);
      
      const lock = await promise;
      
      expect(lock).toBeDefined();
      expect(mockRedis.set).toHaveBeenCalledTimes(3);
    });

    it('should return null after all retries failed', async () => {
      mockRedis.set.mockResolvedValue(null);
      
      const promise = RedisLock.acquire('test:lock', 5000, 2, 50);
      
      await jest.advanceTimersByTimeAsync(50);
      await jest.advanceTimersByTimeAsync(50);
      
      const lock = await promise;
      
      expect(lock).toBeNull();
      expect(mockRedis.set).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('release', () => {
    it('should release lock successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('lock-value-123');
      mockRedis.del.mockResolvedValue(1);
      
      const lock = await RedisLock.acquire('test:lock', 5000);
      const released = await lock.release();
      
      expect(released).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('lock:test:lock');
      expect(mockRedis.del).toHaveBeenCalledWith('lock:test:lock');
    });

    it('should not release lock if value does not match', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('different-value');
      
      const lock = await RedisLock.acquire('test:lock', 5000);
      const released = await lock.release();
      
      expect(released).toBe(false);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return false if lock does not exist', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(null);
      
      const lock = await RedisLock.acquire('test:lock', 5000);
      const released = await lock.release();
      
      expect(released).toBe(false);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('withLock', () => {
    it('should execute function with lock', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('lock-value');
      mockRedis.del.mockResolvedValue(1);
      
      const fn = jest.fn().mockResolvedValue('result');
      
      const result = await RedisLock.withLock('test:lock', fn);
      
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled(); // Lock released
    });

    it('should release lock even if function throws', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('lock-value');
      mockRedis.del.mockResolvedValue(1);
      
      const fn = jest.fn().mockRejectedValue(new Error('Function error'));
      
      await expect(RedisLock.withLock('test:lock', fn)).rejects.toThrow('Function error');
      
      expect(mockRedis.del).toHaveBeenCalled(); // Lock still released
    });

    it('should throw error if cannot acquire lock', async () => {
      mockRedis.set.mockResolvedValue(null);
      
      const fn = jest.fn();
      
      await expect(
        RedisLock.withLock('test:lock', fn, { retryTimes: 0 })
      ).rejects.toThrow('无法获取锁: test:lock');
      
      expect(fn).not.toHaveBeenCalled();
    });

    it('should pass custom options', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue('lock-value');
      mockRedis.del.mockResolvedValue(1);
      
      const fn = jest.fn().mockResolvedValue('result');
      
      await RedisLock.withLock('test:lock', fn, {
        ttl: 10000,
        retryTimes: 5,
        retryDelay: 200
      });
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'lock:test:lock',
        expect.any(String),
        'PX',
        10000,
        'NX'
      );
    });
  });

  describe('isLocked', () => {
    it('should return true if lock exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const locked = await RedisLock.isLocked('test:lock');
      
      expect(locked).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('lock:test:lock');
    });

    it('should return false if lock does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);
      
      const locked = await RedisLock.isLocked('test:lock');
      
      expect(locked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));
      
      await expect(RedisLock.acquire('test:lock', 5000, 0)).rejects.toThrow('Redis connection failed');
    });

    it('should handle release errors gracefully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      
      const lock = await RedisLock.acquire('test:lock', 5000);
      
      await expect(lock.release()).rejects.toThrow('Redis error');
    });
  });

  describe('Lock Value Generation', () => {
    it('should generate unique lock values', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const lock1 = await RedisLock.acquire('test:lock1', 5000);
      const lock2 = await RedisLock.acquire('test:lock2', 5000);
      
      expect(lock1.value).not.toBe(lock2.value);
    });
  });

  describe('Lock Key Prefix', () => {
    it('should add lock: prefix to keys', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      await RedisLock.acquire('my-resource', 5000);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'lock:my-resource',
        expect.any(String),
        'PX',
        5000,
        'NX'
      );
    });
  });
});

