// 验证工具单元测试

const { isValidEmail, isValidPhone, sanitizeInput } = require('../../../src/utils/validator');

describe('Validator Utils', () => {
  describe('isValidEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('应该验证有效的手机号', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('18912345678')).toBe(true);
    });

    it('应该拒绝无效的手机号', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('abc12345678')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('应该清理XSS攻击代码', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('应该保留安全的HTML标签', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
    });
  });
});