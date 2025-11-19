'use client';

import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { Upload, X } from 'lucide-react';
import { CLOUDINARY_CONFIG } from '@/lib/cloudinary';

interface CloudinaryUploadWidgetProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: 'products' | 'categories';
  label?: string;
  disabled?: boolean;
  className?: string;
  generateThumbnail?: boolean;
  onThumbnailChange?: (url: string) => void;
}

export function CloudinaryUploadWidget({
  value,
  onChange,
  onRemove,
  folder = 'products',
  label = 'Subir imagen',
  disabled = false,
  className = '',
  generateThumbnail = false,
  onThumbnailChange,
}: CloudinaryUploadWidgetProps) {
  const config = folder === 'products' ? CLOUDINARY_CONFIG.products : CLOUDINARY_CONFIG.categories;

  const handleUploadSuccess = (result: any) => {
    if (result.event === 'success') {
      const imageUrl = result.info.secure_url;
      onChange(imageUrl);

      // Si se requiere generar thumbnail, crear URL transformada
      if (generateThumbnail && onThumbnailChange && folder === 'products') {
        const publicId = result.info.public_id;
        const thumbnailUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${publicId}`;
        onThumbnailChange(thumbnailUrl);
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
      if (generateThumbnail && onThumbnailChange) {
        onThumbnailChange('');
      }
    }
  };

  // Extraer public_id de la URL para usar con CldImage
  const getPublicIdFromUrl = (url: string): string => {
    if (!url) return '';
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview */}
        {value && (
          <div className="relative group">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
              {getPublicIdFromUrl(value) ? (
                <CldImage
                  src={getPublicIdFromUrl(value)}
                  alt="Preview"
                  width={128}
                  height={128}
                  crop="fill"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upload Widget */}
        <CldUploadWidget
          uploadPreset={CLOUDINARY_CONFIG.uploadPreset}
          options={{
            folder: config.folder,
            maxFileSize: config.maxFileSize,
            clientAllowedFormats: config.allowedFormats,
            maxImageFileSize: config.maxFileSize,
            sources: ['local', 'camera'],
            multiple: false,
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            showSkipCropButton: false,
            resourceType: 'image',
          }}
          onSuccess={handleUploadSuccess}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              disabled={disabled}
              className={`${
                value ? 'px-4 py-2 text-sm' : 'w-32 h-32'
              } border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Upload className={value ? 'w-4 h-4' : 'w-8 h-8'} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {value ? 'Cambiar' : 'Subir'}
              </span>
            </button>
          )}
        </CldUploadWidget>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>Formatos: {config.allowedFormats.join(', ').toUpperCase()}</p>
        <p>Tamaño máximo: {(config.maxFileSize / (1024 * 1024)).toFixed(1)}MB</p>
        {generateThumbnail && <p>Se generará automáticamente un thumbnail de 200x200</p>}
      </div>
    </div>
  );
}
