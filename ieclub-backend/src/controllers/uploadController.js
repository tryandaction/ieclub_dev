// src/controllers/uploadController.js
// 文件上传控制器

const response = require('../utils/response');
const logger = require('../utils/logger');
const OSSService = require('../services/ossService');
const LocalUploadService = require('../services/localUploadService');
const WechatService = require('../services/wechatService');
const axios = require('axios');

class UploadController {
  /**
   * 上传图片（支持多张）
   * POST /api/upload/images
   */
  static async uploadImages(req, res) {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return response.error(res, '请选择要上传的图片');
      }

      logger.info('收到上传请求:', {
        userId: req.userId,
        fileCount: files.length,
        fileNames: files.map(f => f.originalname)
      });

      // 图片安全检测（仅检测第一张，避免性能问题）
      if (files.length > 0) {
        try {
          const securityCheck = await WechatService.imgSecCheck(files[0].buffer);
          if (!securityCheck.pass) {
            return response.error(res, '图片包含违规内容', 400);
          }
        } catch (error) {
          logger.warn('图片安全检测失败，跳过检测:', error.message);
        }
      }

      // 上传所有图片（优先使用本地上传，开发环境）
      let uploadResults;
      try {
        // 尝试使用OSS上传
        uploadResults = await OSSService.uploadImages(files);
        logger.info('OSS上传成功');
      } catch (error) {
        logger.warn('OSS上传失败，使用本地上传:', error.message);
        // 降级到本地上传
        uploadResults = await LocalUploadService.uploadImages(files);
        logger.info('本地上传成功');
      }

      logger.info('图片上传成功:', {
        userId: req.userId,
        count: uploadResults.length,
        results: uploadResults.map(r => ({ url: r.url, size: r.size }))
      });

      return response.success(res, uploadResults, '上传成功');
    } catch (error) {
      logger.error('图片上传失败:', error);
      return response.serverError(res, '上传失败，请重试');
    }
  }

  /**
   * 上传文档（PDF、Word、PPT）
   * POST /api/v1/upload/documents
   */
  static async uploadDocuments(req, res) {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return response.error(res, '请选择要上传的文档');
      }

      // 验证文件类型
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      for (const file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return response.error(res, `不支持的文件类型: ${file.originalname}`);
        }
      }

      // 上传所有文档
      const uploadResults = await OSSService.uploadDocuments(files);

      logger.info('文档上传成功:', {
        userId: req.userId,
        count: uploadResults.length,
      });

      return response.success(res, uploadResults, '上传成功');
    } catch (error) {
      logger.error('文档上传失败:', error);
      return response.serverError(res, '上传失败，请重试');
    }
  }

  /**
   * 获取链接预览信息（OpenGraph）
   * POST /api/v1/upload/link-preview
   */
  static async getLinkPreview(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return response.error(res, '请提供链接地址');
      }

      // URL 验证
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        return response.error(res, '无效的链接地址');
      }

      // 安全检查：只允许 http 和 https 协议
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return response.error(res, '不支持的协议');
      }

      // 获取网页内容
      let html;
      try {
        const axiosResponse = await axios.get(url, {
          timeout: 10000,
          maxRedirects: 5,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        html = axiosResponse.data;
      } catch (error) {
        logger.error('获取链接内容失败:', error);
        return response.error(res, '无法访问该链接', 400);
      }

      // 使用正则表达式解析 HTML（轻量级方案，避免 cheerio 依赖）
      const getMetaContent = (html, property) => {
        // 尝试匹配 <meta property="xxx" content="yyy">
        const propertyMatch = new RegExp(
          `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
          'i'
        ).exec(html);
        if (propertyMatch) return propertyMatch[1];
        
        // 尝试匹配 <meta content="yyy" property="xxx">
        const propertyMatch2 = new RegExp(
          `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
          'i'
        ).exec(html);
        if (propertyMatch2) return propertyMatch2[1];
        
        // 尝试匹配 <meta name="xxx" content="yyy">
        const nameMatch = new RegExp(
          `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
          'i'
        ).exec(html);
        if (nameMatch) return nameMatch[1];
        
        // 尝试匹配 <meta content="yyy" name="xxx">
        const nameMatch2 = new RegExp(
          `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
          'i'
        ).exec(html);
        if (nameMatch2) return nameMatch2[1];
        
        return '';
      };

      const getTitleContent = (html) => {
        const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
        return match ? match[1].trim() : '';
      };

      const preview = {
        url,
        title:
          getMetaContent(html, 'og:title') ||
          getTitleContent(html) ||
          '无标题',
        description:
          getMetaContent(html, 'og:description') ||
          getMetaContent(html, 'description') ||
          '',
        image:
          getMetaContent(html, 'og:image') ||
          getMetaContent(html, 'twitter:image') ||
          '',
        siteName:
          getMetaContent(html, 'og:site_name') ||
          parsedUrl.hostname,
        type: getMetaContent(html, 'og:type') || 'website',
      };

      // 处理相对路径的图片
      if (preview.image && !preview.image.startsWith('http')) {
        preview.image = new URL(preview.image, url).href;
      }

      logger.info('链接预览成功:', { url, title: preview.title });

      return response.success(res, preview, '获取成功');
    } catch (error) {
      logger.error('获取链接预览失败:', error);
      return response.serverError(res, '获取预览失败');
    }
  }

  /**
   * 删除文件
   * DELETE /api/v1/upload/file
   */
  static async deleteFile(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return response.error(res, '请提供文件 URL');
      }

      // 验证 URL 是否属于当前用户上传的文件
      // TODO: 添加权限验证逻辑

      const success = await OSSService.deleteFile(url);

      if (success) {
        return response.success(res, null, '删除成功');
      } else {
        return response.error(res, '删除失败');
      }
    } catch (error) {
      logger.error('删除文件失败:', error);
      return response.serverError(res, '删除失败');
    }
  }

  /**
   * 获取上传签名（用于客户端直传）
   * GET /api/v1/upload/signature
   */
  static async getUploadSignature(req, res) {
    try {
      const { fileType = 'image' } = req.query;

      // 生成唯一文件名
      const { v4: uuidv4 } = require('uuid');
      const timestamp = Date.now();
      const randomId = uuidv4().substring(0, 8);
      const fileName = `${fileType}/${timestamp}-${randomId}`;

      // 生成 OSS 签名 URL
      const signedUrl = await OSSService.getSignedUrl(fileName, 3600);

      return response.success(res, {
        signedUrl,
        fileName,
        expiresIn: 3600,
      });
    } catch (error) {
      logger.error('获取上传签名失败:', error);
      return response.serverError(res);
    }
  }
}

module.exports = UploadController;