import { useState, useRef } from 'react';
import { ImageIcon, Upload, Trash2, Sparkles } from 'lucide-react';
import ImageCropper from './ImageCropper';
import { uploadCover } from '../api/upload';
import { showToast } from './Toast';

// 获取完整图片URL（图片走静态文件服务，不走/api）
const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('linear-gradient')) return url;
  if (url.startsWith('http')) return url;
  const siteUrl = 'https://ieclub.online';
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 预设的渐变背景
const GRADIENT_PRESETS = [
  { name: '星空紫', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '海洋蓝', gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: '日落橙', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '森林绿', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: '深邃黑', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: '极光', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
];

/**
 * 封面图上传组件 - 支持矩形裁剪和渐变预设
 * @param {Object} props
 * @param {string} props.currentCover - 当前封面URL
 * @param {function} props.onCoverChange - 封面更新回调
 * @param {number} props.aspectRatio - 裁剪比例，默认3（3:1）
 * @param {boolean} props.disabled - 是否禁用
 */
export default function CoverUpload({
  currentCover,
  onCoverChange,
  aspectRatio = 3,
  disabled = false
}) {
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGradients, setShowGradients] = useState(false);
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }

    // 验证文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
      showToast('图片大小不能超过20MB', 'error');
      return;
    }

    // 读取文件并打开裁剪器
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // 清空input
    e.target.value = '';
  };

  // 处理裁剪完成
  const handleCropComplete = async (croppedBlob) => {
    setCropperOpen(false);
    setSelectedImage(null);
    setUploading(true);

    try {
      // 创建File对象
      const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
      
      // 上传裁剪后的图片
      const res = await uploadCover(file);
      
      if (res?.url) {
        onCoverChange(res.url);
        showToast('封面上传成功', 'success');
      } else {
        showToast('封面上传失败', 'error');
      }
    } catch (error) {
      console.error('上传失败:', error);
      showToast(error.message || '上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 选择渐变背景
  const handleSelectGradient = (gradient) => {
    onCoverChange(gradient);
    setShowGradients(false);
    showToast('已应用渐变背景', 'success');
  };

  // 移除封面
  const handleRemove = () => {
    onCoverChange('');
    showToast('封面已移除', 'info');
  };

  // 判断当前封面是否为渐变
  const isGradient = currentCover?.startsWith('linear-gradient');

  return (
    <>
      <div className="space-y-3">
        {/* 封面预览区域 */}
        <div
          className="relative w-full h-40 rounded-2xl overflow-hidden bg-gray-100 group cursor-pointer shadow-sm border border-gray-200"
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          {/* 封面图片或渐变 */}
          {currentCover ? (
            <div
              className="w-full h-full"
              style={isGradient ? { background: currentCover } : undefined}
            >
              {!isGradient && (
                <img
                  src={getFullImageUrl(currentCover)}
                  alt="封面"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">点击上传封面图片</span>
            </div>
          )}

          {/* 上传中状态 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                <span className="text-white text-sm">上传中...</span>
              </div>
            </div>
          )}

          {/* 悬停遮罩 */}
          {!uploading && !disabled && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-2 text-white">
                <Upload className="w-6 h-6" />
                <span className="font-medium">更换封面</span>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </button>

          <button
            type="button"
            onClick={() => setShowGradients(!showGradients)}
            disabled={disabled || uploading}
            className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            渐变背景
          </button>

          {currentCover && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              移除
            </button>
          )}
        </div>

        {/* 渐变选择面板 */}
        {showGradients && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {GRADIENT_PRESETS.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectGradient(preset.gradient)}
                className="group relative h-16 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                style={{ background: preset.gradient }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                  <span className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 提示文字 */}
        <p className="text-xs text-gray-400">
          支持 JPG、PNG 格式，建议尺寸 1200×400 像素，文件小于 20MB
        </p>
      </div>

      {/* 图片裁剪弹窗 */}
      <ImageCropper
        image={selectedImage}
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setSelectedImage(null);
        }}
        onCropComplete={handleCropComplete}
        aspect={aspectRatio}
        cropShape="rect"
        title="裁剪封面图片"
      />
    </>
  );
}
