/**
 * OCR识别服务
 * H5环境：使用Tesseract.js进行前端文字识别
 * 小程序环境：仅使用后端API
 */
import Taro from '@tarojs/taro';
import api from './api.js';

// 动态导入 tesseract.js（仅在H5环境）
let createWorker = null;
if (process.env.TARO_ENV === 'h5') {
  try {
    const tesseract = require('tesseract.js');
    createWorker = tesseract.createWorker;
  } catch (e) {
    console.warn('Tesseract.js not available in this environment');
  }
}

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  /**
   * 初始化Tesseract Worker（仅H5环境）
   */
  async initialize() {
    if (this.isInitialized) return;
    
    // 小程序环境不支持 Tesseract
    if (process.env.TARO_ENV !== 'h5' || !createWorker) {
      console.log('当前环境不支持前端OCR，将使用云端API');
      this.isInitialized = true;
      return;
    }
    
    try {
      console.log('初始化OCR服务...');
      this.worker = await createWorker('chi_sim+eng', 1, {
        logger: m => {
          if (m.status === 'loading tesseract core') {
            console.log('加载OCR引擎...');
          }
        }
      });
      this.isInitialized = true;
      console.log('OCR服务初始化完成');
    } catch (error) {
      console.error('OCR初始化失败:', error);
      throw error;
    }
  }

  /**
   * 快速识别（前端Tesseract，仅H5环境）
   * @param {File|Blob|string} imageFile - 图片文件或URL
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} 识别结果
   */
  async quickRecognize(imageFile, onProgress) {
    await this.initialize();
    
    // 小程序环境降级到云端API
    if (process.env.TARO_ENV !== 'h5' || !this.worker) {
      console.log('前端OCR不可用，使用云端API');
      return await this.preciseRecognize(imageFile);
    }
    
    try {
      const result = await this.worker.recognize(imageFile, {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        }
      });

      return {
        text: result.data.text.trim(),
        confidence: Math.round(result.data.confidence),
        method: 'tesseract',
        lines: result.data.lines,
        words: result.data.words
      };
    } catch (error) {
      console.error('OCR识别失败:', error);
      throw new Error('图片识别失败，请重试');
    }
  }

  /**
   * 精确识别（后端API）
   * @param {File} imageFile - 图片文件
   * @returns {Promise<Object>} 识别结果
   */
  async preciseRecognize(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.ocr.recognize(formData);
      
      if (!response.success) {
        throw new Error(response.message || '识别失败');
      }
      
      return {
        text: response.data.text,
        confidence: response.data.confidence,
        method: 'cloud'
      };
    } catch (error) {
      console.error('云端OCR识别失败:', error);
      throw error;
    }
  }

  /**
   * 智能识别（自动选择最佳方案）
   * @param {File} imageFile - 图片文件
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 识别结果
   */
  async smartRecognize(imageFile, options = {}) {
    const { 
      preferFast = true, 
      minConfidence = 80,
      onProgress,
      fallbackToCloud = false
    } = options;

    // 先尝试快速识别
    if (preferFast) {
      try {
        const quickResult = await this.quickRecognize(imageFile, onProgress);
        
        // 如果置信度够高，直接返回
        if (quickResult.confidence >= minConfidence) {
          return quickResult;
        }
        
        // 置信度不够，但不使用云端，仍返回结果
        if (!fallbackToCloud) {
          return quickResult;
        }
      } catch (error) {
        console.error('快速识别失败，尝试云端识别:', error);
      }
    }

    // 使用云端精确识别
    if (fallbackToCloud) {
      try {
        return await this.preciseRecognize(imageFile);
      } catch (error) {
        // 云端也失败了，返回快速识别结果（如果有）
        console.error('云端识别也失败了');
        throw new Error('识别服务暂时不可用，请稍后重试');
      }
    }
  }

  /**
   * 智能提取讲座信息（针对讲座海报）
   * @param {string} text - OCR识别的文本
   * @returns {Object} 提取的结构化信息
   */
  extractLectureInfo(text) {
    const info = {
      title: '',
      speaker: '',
      time: '',
      location: '',
      description: '',
      organizer: '',
      contact: ''
    };

    if (!text) return info;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // 标题通常是第一行或字号最大的文本（这里简化处理：第一行）
    if (lines.length > 0) {
      info.title = lines[0];
    }

    // 使用正则提取关键信息
    const patterns = {
      speaker: /(?:主讲[人者]?|讲[者人]|演讲[者人])[：:\s]*([^\n\r]+)/i,
      time: /(?:时间|日期)[：:\s]*([^\n\r]+)/i,
      location: /(?:地点|位置|场所)[：:\s]*([^\n\r]+)/i,
      organizer: /(?:主办|举办|承办)[：:\s]*([^\n\r]+)/i,
      contact: /(?:联系|咨询|报名)[：:\s]*([^\n\r]+)/i
    };

    // 提取各个字段
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        info[key] = match[1].trim();
      }
    }

    // 描述是去除已提取字段后的剩余内容
    let description = text;
    Object.values(info).forEach(value => {
      if (value) {
        description = description.replace(value, '');
      }
    });
    
    // 清理描述文本
    info.description = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.length > 5) // 过滤太短的行
      .join('\n')
      .substring(0, 500); // 限制长度

    return info;
  }

  /**
   * 验证图片文件
   * @param {File} file - 图片文件
   * @returns {Object} 验证结果
   */
  validateImage(file) {
    const errors = [];
    
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      errors.push('仅支持 JPG、PNG、WebP 格式的图片');
    }
    
    // 检查文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('图片大小不能超过 5MB');
    }
    
    // 检查文件名
    if (!file.name) {
      errors.push('无效的文件');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 清理资源
   */
  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        console.log('OCR服务已终止');
      } catch (error) {
        console.error('终止OCR服务失败:', error);
      }
    }
  }
}

// 导出单例
export default new OCRService();

