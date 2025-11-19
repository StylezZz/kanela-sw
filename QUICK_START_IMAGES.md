# 🚀 Quick Start - Configuración de Imágenes

## Pasos Rápidos (5 minutos)

### 1. Crear cuenta Cloudinary
```
👉 https://cloudinary.com/users/register_free
```

### 2. Obtener Cloud Name
- Entra al dashboard
- Copia tu **Cloud Name** (aparece en la esquina superior)

### 3. Crear Upload Preset
```
Settings > Upload > Upload presets > Add upload preset

Configuración:
- Preset name: kanela-uploads
- Signing mode: Unsigned ⚠️
- Guardar
```

### 4. Configurar Variables
```bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local y agrega:
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=kanela-uploads
```

### 5. Reiniciar servidor
```bash
npm run dev
```

## ✅ ¡Listo!

Ahora puedes:
- Ir a **Productos** > **Nuevo Producto**
- Ver el campo **"Imagen del Producto"**
- Subir imágenes

---

📖 **Documentación completa:** [IMAGE_UPLOAD_SETUP.md](./IMAGE_UPLOAD_SETUP.md)
