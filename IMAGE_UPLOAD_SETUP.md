# 📸 Sistema de Upload de Imágenes con Cloudinary

Este documento explica cómo configurar y usar el sistema de subida de imágenes para productos y categorías.

## 🎯 Características

- ✅ Upload de imágenes para productos
- ✅ Upload de iconos para categorías
- ✅ Generación automática de thumbnails
- ✅ Optimización automática de imágenes
- ✅ CDN global de Cloudinary
- ✅ Vista previa en tiempo real
- ✅ Validación de archivos
- ✅ Plan gratuito: 25GB almacenamiento + 25GB bandwidth/mes

## 📋 Configuración Inicial

### Paso 1: Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Crea una cuenta gratuita
3. Accede al dashboard

### Paso 2: Obtener Cloud Name

1. En el dashboard de Cloudinary, encontrarás tu **Cloud Name**
2. Anótalo, lo necesitarás más adelante

![Cloudinary Dashboard](https://res.cloudinary.com/demo/image/upload/v1/cloudinary_console.png)

### Paso 3: Crear Upload Preset

1. Ve a **Settings** (⚙️) > **Upload** > **Upload presets**
2. Haz clic en **Add upload preset**
3. Configura así:
   - **Preset name**: `kanela-uploads` (o el nombre que prefieras)
   - **Signing mode**: **Unsigned** ⚠️ IMPORTANTE
   - **Folder**: déjalo vacío (se configura por código)
   - **Unique filename**: activado (recomendado)
   - **Overwrite**: desactivado
   - **Access mode**: Public
4. Guarda el preset

### Paso 4: Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edita `.env.local` y agrega tus credenciales:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name_aqui
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=kanela-uploads
   ```

3. Reemplaza `tu_cloud_name_aqui` con el Cloud Name que obtuviste en el Paso 2

### Paso 5: Reiniciar el servidor

```bash
npm run dev
```

## 🚀 Uso

### Subir Imágenes de Productos

1. Ve a la página de **Productos**
2. Haz clic en **Nuevo Producto** o edita uno existente
3. En el formulario verás la sección **"Imagen del Producto"**
4. Haz clic en el área de upload
5. Selecciona una imagen (JPG, PNG, WEBP)
6. La imagen se subirá automáticamente a Cloudinary
7. Se generará un thumbnail automáticamente
8. Guarda el producto

### Subir Iconos de Categorías

Para categorías, puedes usar el componente ejemplo en:
`components/upload/CategoryImageUpload.example.tsx`

## 📁 Estructura de Archivos

```
/home/user/kanela-sw/
├── lib/
│   └── cloudinary.ts              # Configuración de Cloudinary
├── components/
│   └── upload/
│       ├── ImageUpload.tsx        # Componente principal de upload
│       ├── CloudinaryUploadWidget.tsx  # Widget avanzado (opcional)
│       └── CategoryImageUpload.example.tsx  # Ejemplo para categorías
├── app/
│   └── products/
│       └── page.tsx               # Ya integrado con upload
└── .env.local                     # Variables de entorno (no commitear)
```

## 🔧 Configuración Avanzada

### Cambiar tamaños de imagen

Edita `lib/cloudinary.ts`:

```typescript
export const CLOUDINARY_CONFIG = {
  // ...
  products: {
    transformation: {
      main: {
        width: 1000,    // Cambiar ancho
        height: 1000,   // Cambiar alto
        // ...
      },
      thumbnail: {
        width: 300,     // Cambiar ancho de thumbnail
        height: 300,    // Cambiar alto de thumbnail
        // ...
      },
    },
  },
};
```

### Limitar formatos permitidos

En `lib/cloudinary.ts`:

```typescript
allowedFormats: ['jpg', 'png'],  // Solo JPG y PNG
```

### Cambiar tamaño máximo de archivo

```typescript
maxFileSize: 10 * 1024 * 1024,  // 10MB
```

## 📊 Estructura en Cloudinary

Las imágenes se organizan en carpetas:
- `/products/` - Imágenes de productos
- `/categories/` - Iconos de categorías

## ⚠️ Notas Importantes

1. **No commitear** el archivo `.env.local` (ya está en `.gitignore`)
2. **Upload Preset** debe ser **Unsigned** para funcionar desde el frontend
3. El plan gratuito tiene **25GB de almacenamiento** y **25GB de bandwidth**
4. Las imágenes se optimizan automáticamente (WebP, calidad auto)
5. Los thumbnails se generan on-the-fly usando transformaciones de Cloudinary

## 🎨 Ejemplo de Uso en Código

```typescript
import { ImageUpload } from '@/components/upload/ImageUpload';

function MyForm() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <ImageUpload
      label="Mi Imagen"
      value={imageUrl}
      onChange={setImageUrl}
      folder="products"  // o "categories"
    />
  );
}
```

## 🐛 Troubleshooting

### Error: "Cloudinary no está configurado correctamente"
- Verifica que las variables de entorno estén en `.env.local`
- Reinicia el servidor después de agregar las variables

### Error: "Upload failed"
- Verifica que el Upload Preset sea **Unsigned**
- Verifica que el Cloud Name sea correcto
- Verifica que el preset exista en Cloudinary

### Las imágenes no se muestran
- Verifica que la URL se esté guardando en la base de datos
- Abre la consola del navegador para ver errores
- Verifica que el backend esté guardando los campos `image_url` y `thumbnail_url`

## 📚 Recursos

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Next.js + Cloudinary](https://next.cloudinary.dev/)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

## ✅ Checklist de Configuración

- [ ] Cuenta de Cloudinary creada
- [ ] Cloud Name obtenido
- [ ] Upload Preset creado (Unsigned)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Servidor reiniciado
- [ ] Probado upload en productos
- [ ] Imágenes visibles en las cards de productos

---

**¿Necesitas ayuda?** Revisa la consola del navegador y los logs del servidor para más información sobre errores.
