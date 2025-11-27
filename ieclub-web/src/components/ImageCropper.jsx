import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

/**
 * 将裁剪区域应用到图片，生成裁剪后的图片Blob
 */
const createCroppedImage = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
};

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });

/**
 * 图片裁剪组件
 * @param {Object} props
 * @param {string} props.image - 要裁剪的图片URL或base64
 * @param {boolean} props.isOpen - 是否显示裁剪弹窗
 * @param {function} props.onClose - 关闭弹窗回调
 * @param {function} props.onCropComplete - 裁剪完成回调，参数为裁剪后的Blob
 * @param {number} props.aspect - 裁剪比例，默认1（正方形）
 * @param {boolean} props.cropShape - 裁剪形状，'round'或'rect'
 * @param {string} props.title - 弹窗标题
 */
export default function ImageCropper({
  image,
  isOpen,
  onClose,
  onCropComplete,
  aspect = 1,
  cropShape = 'round',
  title = '裁剪图片'
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = setCrop;
  const onZoomChange = setZoom;

  const onCropAreaComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    setLoading(true);
    try {
      const croppedBlob = await createCroppedImage(image, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('裁剪失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 1));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div className="relative h-80 bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === 'rect'}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
            classes={{
              containerClassName: 'h-full',
              mediaClassName: 'h-full object-contain'
            }}
          />
        </div>

        {/* 控制栏 */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
          {/* 缩放滑块 */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={zoom <= 1}
            >
              <ZoomOut className="w-5 h-5 text-gray-600" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-purple-600"
            />
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors ml-2"
            >
              <RotateCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  确认
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
