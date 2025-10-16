// src/services/ossService.js
// 阿里云 OSS 文件服务

const OSS = require('ali-oss');
const sharp = require('sharp');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

// 创建 OSS 客户端
let ossClient = null;

function getOSSClient() {
  if (!ossClient) {
    ossClient = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
      endpoint: config.oss.endpoint,
      timeout: 60000, // 60秒超时
    });
  }
  return ossClient;
}

class OSSService {
  /**
   * 上传图片并生成缩略图
   * @param {Array} files - 文件数组
   */
  static async uploadImages(files) {
    try {
      const client = getOSSClient();
      const results = [];

      for (const file of files) {
        const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(2)}`;
        const originalName = `${fileName}-original.jpg`;
        const thumbnailName = `${fileName}-thumb.jpg`;

        // 上传原图
        await client.put(originalName, file.buffer);

        // 生成并上传缩略图
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(400, 400, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        await client.put(thumbnailName, thumbnailBuffer);

        // 获取 OSS 域名
        const originalUrl = config.oss.cdnDomain
          ? `${config.oss.cdnDomain}/${originalName}`
          : `https://${config.oss.bucket}.${config.oss.endpoint}/${originalName}`;

        const thumbnailUrl = config.oss.cdnDomain
          ? `${config.oss.cdnDomain}/${thumbnailName}`
          : `https://${config.oss.bucket}.${config.oss.endpoint}/${thumbnailName}`;

        results.push({
          url: originalUrl,
          thumbnail: thumbnailUrl,
          width: 1920, // 这里应该从图片信息中获取
          height: 1080,
          size: file.size,
          originalName: file.originalname,
        });
      }

      return results;
    } catch (error) {
      logger.error('图片上传失败:', error);
      throw error;
    }
  }

  /**
   * 上传文档
   * @param {Array} files - 文件数组
   */
  static async uploadDocuments(files) {
    try {
      const client = getOSSClient();
      const results = [];

      for (const file of files) {
        const fileName = `documents/${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;

        await client.put(fileName, file.buffer);

        const fileUrl = config.oss.cdnDomain
          ? `${config.oss.cdnDomain}/${fileName}`
          : `https://${config.oss.bucket}.${config.oss.endpoint}/${fileName}`;

        results.push({
          name: file.originalname,
          url: fileUrl,
          size: file.size,
          type: file.mimetype,
        });
      }

      return results;
    } catch (error) {
      logger.error('文档上传失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param {string} url - 文件URL
   */
  static async deleteFile(url) {
    try {
      const client = getOSSClient();

      // 从URL中提取文件名
      const fileName = url.split('/').pop();

      if (!fileName) {
        return false;
      }

      await client.delete(fileName);
      return true;
    } catch (error) {
      logger.error('删除文件失败:', error);
      return false;
    }
  }

  /**
   * 生成签名URL（用于客户端直传）
   * @param {string} fileName - 文件名
   * @param {number} expires - 过期时间（秒）
   */
  static async getSignedUrl(fileName, expires = 3600) {
    try {
      const client = getOSSClient();

      const signedUrl = await client.signatureUrl(fileName, {
        expires,
        method: 'PUT',
      });

      return signedUrl;
    } catch (error) {
      logger.error('生成签名URL失败:', error);
      throw error;
    }
  }
}

module.exports = OSSService;