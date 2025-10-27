/**
 * 文件上传组件
 * 支持图片、文档（PPT、PDF、Word等）上传
 */
import React, { useState, useRef } from 'react';
import Icon from './Icon.jsx';

export const FileUpload = ({ 
  label, 
  accept = 'image/*,.pdf,.ppt,.pptx,.doc,.docx', 
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  onChange,
  value = []
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFiles = async (files) => {
    setError('');

    // 验证文件大小
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`文件 "${oversizedFiles[0].name}" 超过大小限制（最大 ${maxSize / 1024 / 1024}MB）`);
      return;
    }

    // 验证文件类型
    const allowedTypes = accept.split(',').map(t => t.trim());
    const invalidFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const type = file.type;
      return !allowedTypes.some(allowed => 
        allowed === type || 
        allowed === ext || 
        (allowed.includes('*') && type.startsWith(allowed.split('*')[0]))
      );
    });
    
    if (invalidFiles.length > 0) {
      setError(`文件类型不支持：${invalidFiles[0].name}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度（实际应该调用API并追踪进度）
      const uploadedFiles = await Promise.all(
        files.map((file, index) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                // 综合所有文件的进度
                setUploadProgress(Math.round((index * 100 + progress) / files.length));
              }
            };
            
            reader.onloadend = () => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                url: reader.result, // 预览URL
                uploadedAt: new Date().toISOString()
              });
            };
            
            reader.readAsDataURL(file);
          });
        })
      );

      setUploadProgress(100);
      
      // 调用父组件的onChange
      onChange([...value, ...uploadedFiles]);
      
      // 清空进度
      setTimeout(() => setUploadProgress(0), 500);
    } catch (err) {
      setError('上传失败，请重试');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  // 拖拽上传处理
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleRemoveFile = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'document';
    if (type.includes('word') || type.includes('doc')) return 'document';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'document';
    return 'document';
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      {/* 拖拽上传区域 */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-purple-500 bg-purple-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragOver ? 'bg-purple-200' : 'bg-purple-100'}`}>
            <Icon icon={uploading ? 'loading' : 'upload'} size="lg" color="#8B5CF6" />
          </div>
          
          {uploading ? (
            <>
              <p className="text-sm font-medium text-gray-700 leading-none">
                上传中... {uploadProgress}%
              </p>
              {/* 进度条 */}
              <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 leading-none">
                {isDragOver ? '松开鼠标上传文件' : '点击选择或拖拽文件到这里'}
              </p>
              <p className="text-xs text-gray-500 leading-none">
                支持 {accept.includes('image') ? '图片、' : ''}PDF、PPT、Word 等，单个最大 {maxSize / 1024 / 1024}MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <Icon icon="error" size="sm" color="#DC2626" />
          <span className="leading-none">{error}</span>
        </div>
      )}

      {/* 文件列表 */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                      <Icon icon={getFileIcon(file.type)} size="md" color="#8B5CF6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate leading-none">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-none">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="flex-shrink-0 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Icon icon="delete" size="sm" color="#EF4444" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FileUpload;

