/**
 * API 响应处理工具测试
 */

import { describe, it, expect } from 'vitest'
import {
  safeGet,
  isSuccessResponse,
  extractData,
  extractErrorMessage,
  normalizeResponse,
  ensureArray,
  ensureObject,
  ensureNumber,
  ensureString,
  extractPaginationData
} from '../utils/apiResponseHandler'

describe('apiResponseHandler', () => {
  describe('safeGet', () => {
    it('should get nested property safely', () => {
      const obj = { a: { b: { c: 123 } } }
      expect(safeGet(obj, 'a.b.c')).toBe(123)
    })

    it('should return default value for undefined path', () => {
      const obj = { a: { b: {} } }
      expect(safeGet(obj, 'a.b.c', 'default')).toBe('default')
    })

    it('should handle null object', () => {
      expect(safeGet(null, 'a.b.c', 'default')).toBe('default')
    })
  })

  describe('isSuccessResponse', () => {
    it('should return true for success response format 1', () => {
      const response = { success: true, data: {} }
      expect(isSuccessResponse(response)).toBe(true)
    })

    it('should return true for success response format 2', () => {
      const response = { code: 200, data: {} }
      expect(isSuccessResponse(response)).toBe(true)
    })

    it('should return false for error response', () => {
      const response = { success: false, message: 'error' }
      expect(isSuccessResponse(response)).toBe(false)
    })
  })

  describe('extractData', () => {
    it('should extract data from format 1', () => {
      const response = { success: true, data: { user: 'test' } }
      expect(extractData(response)).toEqual({ user: 'test' })
    })

    it('should extract data from format 2', () => {
      const response = { code: 200, data: { user: 'test' } }
      expect(extractData(response)).toEqual({ user: 'test' })
    })

    it('should return default value for null response', () => {
      expect(extractData(null, 'default')).toBe('default')
    })
  })

  describe('extractErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('test error')
      expect(extractErrorMessage(error)).toBe('test error')
    })

    it('should extract message from response object', () => {
      const error = { message: 'api error' }
      expect(extractErrorMessage(error)).toBe('api error')
    })

    it('should return default message for unknown error', () => {
      expect(extractErrorMessage(null)).toBe('未知错误')
    })
  })

  describe('ensureArray', () => {
    it('should return array as is', () => {
      const arr = [1, 2, 3]
      expect(ensureArray(arr)).toEqual(arr)
    })

    it('should return default for non-array', () => {
      expect(ensureArray('not array', [])).toEqual([])
    })
  })

  describe('ensureNumber', () => {
    it('should convert string to number', () => {
      expect(ensureNumber('123')).toBe(123)
    })

    it('should return default for NaN', () => {
      expect(ensureNumber('abc', 0)).toBe(0)
    })
  })

  describe('extractPaginationData', () => {
    it('should extract pagination data correctly', () => {
      const response = {
        success: true,
        data: {
          list: [1, 2, 3],
          total: 100,
          page: 1,
          pageSize: 10
        }
      }
      
      const result = extractPaginationData(response)
      expect(result.list).toEqual([1, 2, 3])
      expect(result.total).toBe(100)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })
  })
})

