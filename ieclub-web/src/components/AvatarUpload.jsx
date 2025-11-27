import { useState, useRef } from 'react';
import { Camera, Upload, Trash2, User } from 'lucide-react';
import ImageCropper from './ImageCropper';
import { uploadAvatar } from '../api/upload';
import { showToast } from './Toast';

// 获取完整图片URL（图片走静态文件服务，不走/api）
const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const siteUrl = 'https://ieclub.online';
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * 头像上传组件 - 支持圆形裁剪
 * @param {Object} props
 * @param {string} props.currentAvatar - 当前头像URL
 * @param {function} props.onAvatarChange - 头像更新回调
 * @param {number} props.size - 头像显示尺寸，默认96px
 * @param {boolean} props.disabled - 是否禁用
 */
export default function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  size = 96,
  disabled = false
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片大小不能超过10MB', 'error');
      return;
    }

    // 读取文件并打开裁剪器
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // 清空input，允许重复选择同一文件
    e.target.value = '';
  };

  // 处理裁剪完成
  const handleCropComplete = async (croppedBlob) => {
    setCropperOpen(false);
    setSelectedImage(null);
    setUploading(true);

    try {
      // 创建File对象
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      // 上传裁剪后的图片
      const res = await uploadAvatar(file);
      
      if (res?.url) {
        onAvatarChange(res.url);
        showToast('头像上传成功', 'success');
      } else {
        showToast('头像上传失败', 'error');
      }
    } catch (error) {
      console.error('上传失败:', error);
      showToast(error.message || '上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  // 删除头像
  const handleRemove = () => {
    onAvatarChange('');
    showToast('头像已移除', 'info');
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* 头像预览 */}
        <div
          className="relative group cursor-pointer"
          style={{ width: size, height: size }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          {/* 头像图片或默认图标 */}
          <div
            className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center border-4 border-white shadow-lg"
          >
            {currentAvatar ? (
              <img
                src={getFullImageUrl(currentAvatar)}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-1/2 h-1/2 text-purple-300" />
            )}
          </div>

          {/* 上传中状态 */}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* 悬停遮罩 */}
          {!uploading && !disabled && isHovering && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-all duration-200">
              <Camera className="w-8 h-8 text-white" />
            </div>
          )}

          {/* 相机图标（始终显示在右下角） */}
          {!uploading && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <Camera className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
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
            {uploading ? '上传中...' : '更换头像'}
          </button>

          {currentAvatar && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              移除头像
            </button>
          )}
        </div>
      </div>

      {/* 提示文字 */}
      <p className="mt-2 text-xs text-gray-400">
        支持 JPG、PNG、GIF 格式，文件小于 10MB
      </p>

      {/* 图片裁剪弹窗 */}
      <ImageCropper
        image={selectedImage}
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setSelectedImage(null);
        }}
        onCropComplete={handleCropComplete}
        aspect={1}
        cropShape="round"
        title="裁剪头像"
      />
    </>
  );
}
