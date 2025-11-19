'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { CLOUDINARY_CONFIG, validateImageFile } from '@/lib/cloudinary';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: 'products' | 'categories';
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = 'products',
  label = 'Subir imagen',
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = folder === 'products' ? CLOUDINARY_CONFIG.products : CLOUDINARY_CONFIG.categories;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = validateImageFile(file, config.maxFileSize);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Verificar configuración de Cloudinary
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
      toast.error('Cloudinary no está configurado correctamente');
      console.error('⚠️ Falta configurar CLOUDINARY_CLOUD_NAME o CLOUDINARY_UPLOAD_PRESET');
      return;
    }

    setUploading(true);

    try {
      // Crear FormData para enviar a Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', config.folder);

      // Subir a Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      setPreview(imageUrl);
      onChange(imageUrl);
      toast.success('Imagen subida exitosamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen. Intenta nuevamente.');
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview o Upload Button */}
        {preview ? (
          <div className="relative group">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
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
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || uploading}
            className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <Upload className="w-5 h-5 text-gray-400" />
              </>
            )}
          </button>
        )}

        {/* Info */}
        <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium">
            {uploading ? 'Subiendo imagen...' : preview ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </p>
          <p className="text-xs mt-1">
            Formatos: {config.allowedFormats.join(', ').toUpperCase()}
          </p>
          <p className="text-xs">
            Tamaño máximo: {(config.maxFileSize / (1024 * 1024)).toFixed(1)}MB
          </p>
          {preview && !disabled && (
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="text-blue-600 dark:text-blue-400 hover:underline mt-2 text-xs disabled:opacity-50"
            >
              Seleccionar otra imagen
            </button>
          )}
        </div>
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.allowedFormats.map((f) => `image/${f}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}
