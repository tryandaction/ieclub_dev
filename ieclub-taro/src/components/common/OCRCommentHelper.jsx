/**
 * OCR评论助手组件
 * 用于在评论时快速识别图片文字并插入到评论框
 */
import React, { useState, useRef } from 'react';
import { ScanText, Upload, X, Loader, Copy, CheckCircle } from 'lucide-react';
import ocrService from '../../services/ocr.service.js';
import { useToast } from './Toast.jsx';

const OCRCommentHelper = ({ onInsert, isOpen, onClose }) => {
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
        fallbackToCloud: false
      });

      setRecognizedText(result.text);
      setConfidence(result.confidence);

      toast.success(`识别完成！准确度 ${result.confidence}%`, {
        duration: 2000
      });

    } catch (error) {
      console.error('OCR识别失败:', error);
      toast.error(error.message || '识别失败，请重试');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleInsertToComment = () => {
    if (recognizedText && onInsert) {
      onInsert(recognizedText);
      handleClose();
      toast.success('已插入到评论框');
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

  const handleClose = () => {
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
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
              <ScanText className="text-white" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">图片文字识别</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-4">
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
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <Upload className="text-blue-600" size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      点击上传图片
                    </p>
                    <p className="text-xs text-gray-500">
                      支持 JPG、PNG、WebP，最大 5MB
                    </p>
                  </div>
                </div>
              </div>
            </label>
          ) : (
            <div className="space-y-4">
              {/* 图片预览 */}
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-64 object-contain"
                />
                
                {/* 识别中遮罩 */}
                {uploading && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-indigo-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader className="animate-spin text-white mb-3" size={40} />
                    <p className="text-white text-lg font-semibold">识别中...</p>
                    <p className="text-white text-sm opacity-90 mt-1">{progress}%</p>
                  </div>
                )}
                
                {/* 识别完成 */}
                {!uploading && recognizedText && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                    <CheckCircle size={20} />
                  </div>
                )}
              </div>

              {/* 识别结果 */}
              {recognizedText && !uploading && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">识别结果</span>
                    <div className="flex items-center gap-3">
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
                  <textarea 
                    value={recognizedText}
                    onChange={(e) => setRecognizedText(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="识别的文字将显示在这里，可以手动编辑..."
                  />
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  取消
                </button>
                {recognizedText && !uploading && (
                  <button
                    onClick={handleInsertToComment}
                    className="flex-1 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                  >
                    插入评论
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">💡 提示：</span> 
              为获得最佳识别效果，请确保图片清晰、光线充足、文字完整。识别后可手动编辑文本。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRCommentHelper;

