/**
 * OCR智能上传组件
 * 支持图片上传、文字识别、智能提取
 */
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader, CheckCircle, X, RefreshCw, Copy } from 'lucide-react';
import ocrService from '../../services/ocr.service.js';
import { useToast } from './Toast.jsx';

const OCRUploader = ({ onRecognized, onExtracted, className = '' }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    const validation = ocrService.validateImage(file);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    // 显示预览
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploading(true);
    setProgress(0);
    setRecognizedText('');
    setConfidence(0);

    try {
      // 智能识别
      const result = await ocrService.smartRecognize(file, {
        preferFast: true,
        minConfidence: 75,
        onProgress: (p) => setProgress(p),
        fallbackToCloud: false // 只使用前端识别
      });

      setRecognizedText(result.text);
      setConfidence(result.confidence);

      // 提取讲座信息
      const extracted = ocrService.extractLectureInfo(result.text);

      toast.success(`识别完成！准确度 ${result.confidence}%`, {
        duration: 2000
      });

      // 回调
      if (onRecognized) {
        onRecognized(result);
      }
      if (onExtracted) {
        onExtracted(extracted);
      }

    } catch (error) {
      console.error('OCR识别失败:', error);
      toast.error(error.message || '识别失败，请重试');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecognizedText('');
    setConfidence(0);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyText = () => {
    if (recognizedText) {
      navigator.clipboard.writeText(recognizedText)
        .then(() => {
          toast.success('已复制到剪贴板');
        })
        .catch(() => {
          toast.error('复制失败');
        });
    }
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm ${className}`}>
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
          <Camera className="text-white" size={18} />
        </div>
        <span className="font-semibold text-gray-800">智能填写助手</span>
        <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full font-medium">
          AI识别
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        上传讲座海报，AI自动识别并填充表单内容
      </p>

      {/* 上传区域 */}
      {!previewUrl ? (
        <label className="block cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div className="w-full py-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-100/50 transition-all duration-200">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-blue-100 p-3 rounded-full">
                <Upload className="text-blue-600" size={28} />
              </div>
              <span className="text-sm text-gray-700 font-medium">
                点击上传或拖拽图片
              </span>
              <span className="text-xs text-gray-500">
                支持 JPG、PNG、WebP 格式，最大 5MB
              </span>
            </div>
          </div>
        </label>
      ) : (
        <div className="space-y-3">
          {/* 图片预览 */}
          <div className="relative rounded-lg overflow-hidden border-2 border-blue-200 bg-white">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-contain bg-gray-50"
            />
            
            {/* 识别中遮罩 */}
            {uploading && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-indigo-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="text-center text-white">
                  <Loader className="animate-spin mx-auto mb-3" size={40} />
                  <p className="text-lg font-semibold mb-1">AI识别中...</p>
                  <p className="text-sm opacity-90">{progress}%</p>
                </div>
              </div>
            )}
            
            {/* 识别完成标识 */}
            {!uploading && recognizedText && (
              <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                <CheckCircle size={20} />
              </div>
            )}
          </div>

          {/* 识别结果 */}
          {recognizedText && !uploading && (
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">识别结果</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    准确度: <span className={`font-semibold ${confidence >= 85 ? 'text-green-600' : confidence >= 70 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {confidence}%
                    </span>
                  </span>
                  <button
                    onClick={handleCopyText}
                    className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                    title="复制文本"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                {recognizedText}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              disabled={uploading}
            >
              <RefreshCw size={16} />
              重新上传
            </button>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-3 text-xs text-gray-500 flex items-start gap-1">
        <span className="mt-0.5">💡</span>
        <span>
          提示：为获得最佳识别效果，请确保图片清晰、光线充足、文字完整
        </span>
      </div>
    </div>
  );
};

export default OCRUploader;

