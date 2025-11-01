// ieclub-backend/src/services/imageService.js
// 图片处理服务 - 压缩、裁剪、格式转换

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ImageService {
  constructor() {
    // 配置参数
    this.config = {
      maxWidth: 1920,  // 最大宽度
      maxHeight: 1920, // 最大高度
      quality: 80,     // 压缩质量
      thumbnailWidth: 300, // 缩略图宽度
      thumbnailHeight: 300, // 缩略图高度
      allowedFormats: ['jpeg', 'jpg', 'png', 'webp', 'gif']
    };
  }

  /**
   * 压缩图片
   */
  async compressImage(inputPath, outputPath, options = {}) {
    const {
      maxWidth = this.config.maxWidth,
      maxHeight = this.config.maxHeight,
      quality = this.config.quality,
      format = 'jpeg'
    } = options;

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      logger.info(`压缩图片: ${path.basename(inputPath)}`, {
        originalSize: metadata.size,
        originalWidth: metadata.width,
        originalHeight: metadata.height
      });

      // 调整大小（保持宽高比）
      let processedImage = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // 根据格式压缩
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          processedImage = processedImage.jpeg({ quality });
          break;
        case 'png':
          processedImage = processedImage.png({ 
            quality,
            compressionLevel: 9
          });
          break;
        case 'webp':
          processedImage = processedImage.webp({ quality });
          break;
        default:
          processedImage = processedImage.jpeg({ quality });
      }

      await processedImage.toFile(outputPath);

      // 获取压缩后的文件信息
      const stats = await fs.stat(outputPath);
      const compressedMetadata = await sharp(outputPath).metadata();

      logger.info(`图片压缩完成`, {
        compressedSize: stats.size,
        compressionRatio: ((1 - stats.size / metadata.size) * 100).toFixed(2) + '%',
        width: compressedMetadata.width,
        height: compressedMetadata.height
      });

      return {
        success: true,
        outputPath,
        originalSize: metadata.size,
        compressedSize: stats.size,
        width: compressedMetadata.width,
        height: compressedMetadata.height
      };
    } catch (error) {
      logger.error('图片压缩失败:', error);
      throw error;
    }
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(inputPath, outputPath, options = {}) {
    const {
      width = this.config.thumbnailWidth,
      height = this.config.thumbnailHeight,
      fit = 'cover' // cover, contain, fill, inside, outside
    } = options;

    try {
      await sharp(inputPath)
        .resize(width, height, { fit })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      logger.info(`生成缩略图: ${path.basename(outputPath)}`);

      return {
        success: true,
        outputPath,
        width,
        height
      };
    } catch (error) {
      logger.error('生成缩略图失败:', error);
      throw error;
    }
  }

  /**
   * 批量处理图片
   */
  async processImages(files, outputDir, options = {}) {
    const results = [];

    for (const file of files) {
      try {
        const filename = path.basename(file.filename, path.extname(file.filename));
        const outputPath = path.join(outputDir, `${filename}_compressed.jpg`);
        const thumbnailPath = path.join(outputDir, `${filename}_thumb.jpg`);

        // 压缩原图
        const compressed = await this.compressImage(file.path, outputPath, options);

        // 生成缩略图
        const thumbnail = await this.generateThumbnail(file.path, thumbnailPath, options);

        results.push({
          original: file,
          compressed: compressed.outputPath,
          thumbnail: thumbnail.outputPath,
          stats: {
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize,
            width: compressed.width,
            height: compressed.height
          }
        });

        // 删除原文件（如果需要）
        if (options.deleteOriginal) {
          await fs.unlink(file.path);
        }
      } catch (error) {
        logger.error(`处理图片失败: ${file.filename}`, error);
        results.push({
          original: file,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 裁剪图片
   */
  async cropImage(inputPath, outputPath, options = {}) {
    const {
      width,
      height,
      left = 0,
      top = 0
    } = options;

    try {
      await sharp(inputPath)
        .extract({
          left,
          top,
          width,
          height
        })
        .toFile(outputPath);

      logger.info(`裁剪图片: ${path.basename(outputPath)}`);

      return {
        success: true,
        outputPath
      };
    } catch (error) {
      logger.error('裁剪图片失败:', error);
      throw error;
    }
  }

  /**
   * 转换图片格式
   */
  async convertFormat(inputPath, outputPath, targetFormat = 'jpeg', options = {}) {
    const { quality = 80 } = options;

    try {
      let image = sharp(inputPath);

      switch (targetFormat.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality });
          break;
        case 'png':
          image = image.png({ quality });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
        case 'gif':
          image = image.gif();
          break;
        default:
          throw new Error(`不支持的格式: ${targetFormat}`);
      }

      await image.toFile(outputPath);

      logger.info(`转换图片格式: ${targetFormat}`);

      return {
        success: true,
        outputPath,
        format: targetFormat
      };
    } catch (error) {
      logger.error('转换图片格式失败:', error);
      throw error;
    }
  }

  /**
   * 添加水印
   */
  async addWatermark(inputPath, outputPath, watermarkPath, options = {}) {
    const {
      position = 'southeast', // northwest, northeast, southwest, southeast, center
      opacity = 0.5
    } = options;

    try {
      const watermark = await sharp(watermarkPath)
        .resize(200) // 水印大小
        .composite([{
          input: Buffer.from([255, 255, 255, 255 * opacity]),
          raw: {
            width: 1,
            height: 1,
            channels: 4
          },
          tile: true,
          blend: 'dest-in'
        }])
        .toBuffer();

      // 根据位置计算偏移
      // const metadata = await sharp(inputPath).metadata();
      // const watermarkMetadata = await sharp(watermark).metadata();

      const gravity = position;
      
      await sharp(inputPath)
        .composite([{
          input: watermark,
          gravity
        }])
        .toFile(outputPath);

      logger.info(`添加水印: ${path.basename(outputPath)}`);

      return {
        success: true,
        outputPath
      };
    } catch (error) {
      logger.error('添加水印失败:', error);
      throw error;
    }
  }

  /**
   * 验证图片文件
   */
  async validateImage(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      
      const format = metadata.format.toLowerCase();
      if (!this.config.allowedFormats.includes(format)) {
        return {
          valid: false,
          error: `不支持的图片格式: ${format}`
        };
      }

      // 检查文件大小（最大10MB）
      const stats = await fs.stat(filePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        return {
          valid: false,
          error: `图片文件过大: ${(stats.size / 1024 / 1024).toFixed(2)}MB (最大10MB)`
        };
      }

      return {
        valid: true,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          size: stats.size,
          space: metadata.space,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha
        }
      };
    } catch (error) {
      logger.error('验证图片失败:', error);
      return {
        valid: false,
        error: '无效的图片文件'
      };
    }
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = await fs.stat(filePath);

      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: stats.size,
        space: metadata.space,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      logger.error('获取图片信息失败:', error);
      throw error;
    }
  }
}

module.exports = new ImageService();

