/**
 * Configuración de Cloudinary para subida de imágenes
 *
 * Para configurar Cloudinary:
 * 1. Crea una cuenta gratuita en https://cloudinary.com
 * 2. Obtén tu Cloud Name del dashboard
 * 3. Habilita "unsigned uploads" en Settings > Upload > Upload presets
 * 4. Crea un upload preset con nombre "kanela-uploads" (o el que prefieras)
 * 5. Configura las variables de entorno en .env.local
 */

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'kanela-uploads',

  // Configuración de productos
  products: {
    folder: 'products',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: {
      // Imagen principal
      main: {
        width: 800,
        height: 800,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
      // Thumbnail
      thumbnail: {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
    },
  },

  // Configuración de categorías
  categories: {
    folder: 'categories',
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: {
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },
};

/**
 * Genera URL de Cloudinary con transformaciones
 */
export function getCloudinaryUrl(
  publicId: string,
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    [key: string]: string | number | undefined;
  }
): string {
  if (!CLOUDINARY_CONFIG.cloudName) {
    console.warn('⚠️ Cloudinary Cloud Name no configurado');
    return '';
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

  if (!transformation) {
    return `${baseUrl}/${publicId}`;
  }

  const transformStr = Object.entries(transformation)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `${baseUrl}/${transformStr}/${publicId}`;
}

/**
 * Extrae el public_id de una URL de Cloudinary
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null;

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

/**
 * Valida que el archivo sea una imagen válida
 */
export function validateImageFile(file: File, maxSize: number): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'El archivo debe ser una imagen' };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `El archivo no debe superar ${maxSizeMB}MB` };
  }

  return { valid: true };
}
