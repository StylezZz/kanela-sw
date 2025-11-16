# Kanela - Sistema de Cafetería Escolar

Sistema integral de gestión para cafetería escolar desarrollado con Next.js 16, TypeScript y shadcn/ui.

## Características Principales

### 🎨 Interfaz de Usuario
- Diseño moderno con componentes shadcn/ui
- Tema personalizado con colores anaranjados
- Totalmente responsive (móvil, tablet, desktop)
- Modo claro y oscuro

### 🔐 Sistema de Autenticación
- Login con diferentes roles:
  - **Administrador**: Gestión completa del sistema
  - **Estudiantes**: Primaria y Secundaria
  - **Profesores**: Acceso especial
- Context API para gestión de sesión

### 📦 Gestión de Productos (Admin)
- CRUD completo de productos
- Categorías: Almuerzos, Bebidas, Snacks, Postres, Útiles, Otros
- Control de inventario y stock
- Alertas de stock bajo
- Precios y descripciones

### 📅 Menú Semanal
- Configuración de menú diario (Lunes a Viernes)
- Sistema de reservas de menú
- Contabilización automática de reservas
- Visualización por día de la semana

### 🛒 Sistema de Pedidos
- Carrito de compras intuitivo
- Proceso de checkout simplificado
- Múltiples métodos de pago
- Gestión de órdenes para admin
- Estados: Pendiente, En Proceso, Completado, Cancelado

### 💰 Sistema de Cuentas y Fiado
- Balance de cuenta por usuario
- Sistema de crédito (fiado)
- Registro completo de transacciones
- Historial de movimientos
- Pagos y abonos

### 💳 Métodos de Pago
- Efectivo
- Yape
- Plin
- Transferencia Bancaria
- Fiado (sistema de crédito)

### 📊 Dashboards
- **Admin**: Estadísticas, ventas, órdenes pendientes, productos con bajo stock
- **Cliente**: Balance, menú del día, accesos rápidos

## Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **UI Components**: shadcn/ui
- **Estilos**: Tailwind CSS 4
- **Estado Global**: Context API (React)
- **Persistencia**: LocalStorage
- **Iconos**: Lucide React
- **Notificaciones**: Sonner

## Instalación

```bash
# Instalar dependencias
npm install
# o
pnpm install
# o
yarn install

# Ejecutar en desarrollo
npm run dev
# o
pnpm dev
# o
yarn dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Usuarios de Prueba

El sistema incluye usuarios de demostración:

### Administrador
- **Email**: admin@colegio.com
- **Password**: cualquiera (modo demo)
- **Acceso**: Gestión completa del sistema

### Estudiante Secundaria
- **Email**: maria@estudiante.com
- **Password**: cualquiera (modo demo)
- **Tipo**: Secundaria - 5to A
- **Balance inicial**: -S/ 15.50 (deuda)

### Estudiante Primaria
- **Email**: pedro@estudiante.com
- **Password**: cualquiera (modo demo)
- **Tipo**: Primaria - 4to B
- **Balance inicial**: S/ 0.00

### Profesor
- **Email**: ana@profesor.com
- **Password**: cualquiera (modo demo)
- **Balance inicial**: S/ 0.00

> **Nota**: En modo demo, cualquier contraseña es válida. Para producción, implementar autenticación real con backend.

## Estructura del Proyecto

```
kanela-sw/
├── app/
│   ├── account/         # Página de cuenta del usuario
│   ├── cart/            # Carrito de compras
│   ├── dashboard/       # Dashboard principal
│   ├── login/           # Página de login
│   ├── menu/            # Menú semanal
│   ├── my-orders/       # Pedidos del cliente
│   ├── orders/          # Gestión de órdenes (admin)
│   ├── products/        # Catálogo y gestión de productos
│   ├── globals.css      # Estilos globales con tema
│   └── layout.tsx       # Layout principal con providers
├── components/
│   ├── auth/            # Componentes de autenticación
│   ├── dashboard/       # Componentes de dashboard
│   ├── layout/          # Navbar, Sidebar, DashboardLayout
│   └── ui/              # Componentes shadcn/ui
├── contexts/
│   ├── AuthContext.tsx  # Contexto de autenticación
│   ├── AppContext.tsx   # Contexto de datos globales
│   └── CartContext.tsx  # Contexto del carrito
├── lib/
│   ├── data.ts          # Datos iniciales y helpers
│   ├── types.ts         # Tipos TypeScript
│   └── utils.ts         # Utilidades
└── public/              # Archivos estáticos
```

## Funcionalidades por Rol

### Administrador
- ✅ Dashboard con estadísticas de ventas
- ✅ Gestión de productos (CRUD)
- ✅ Configuración de menú semanal
- ✅ Gestión de órdenes y pedidos
- ✅ Visualización de deuda total
- ✅ Cambio de estados de pedidos
- ✅ Control de inventario

### Cliente (Estudiantes/Profesores)
- ✅ Catálogo de productos
- ✅ Carrito de compras
- ✅ Reserva de menú semanal
- ✅ Visualización de balance
- ✅ Historial de pedidos
- ✅ Historial de transacciones
- ✅ Registro de pagos
- ✅ Sistema de fiado

## Flujo de Uso

### Para Clientes:
1. **Login** con credenciales
2. **Explorar productos** desde el dashboard o menú
3. **Agregar al carrito** productos deseados
4. **Checkout**: Seleccionar método de pago
5. **Confirmar pedido**
6. **Ver estado** en "Mis Pedidos"
7. **Gestionar cuenta**: Ver balance, hacer pagos

### Para Administradores:
1. **Login** como admin
2. **Ver dashboard** con estadísticas
3. **Gestionar productos**: Agregar, editar, eliminar
4. **Configurar menú** de la semana
5. **Gestionar órdenes**: Cambiar estados
6. **Monitorear inventario** y stock
7. **Revisar transacciones** y deudas

## Datos Iniciales

El sistema incluye datos de ejemplo:
- 4 usuarios (1 admin, 2 estudiantes, 1 profesor)
- 8 productos en diferentes categorías
- 5 menús (Lunes a Viernes)

Los datos se almacenan en **localStorage** y se inicializan automáticamente al primer uso.

## Personalización del Tema

Los colores están definidos en `app/globals.css` usando variables CSS con el espacio de color OKLCH:

```css
:root {
  --primary: oklch(0.65 0.20 45);  /* Naranja principal */
  --accent: oklch(0.75 0.18 55);   /* Naranja acento */
  /* ... más variables */
}
```

## Build y Producción

```bash
# Build de producción
npm run build

# Iniciar servidor de producción
npm start
```

## Características de Seguridad

⚠️ **Importante**: Este es un proyecto de demostración que usa localStorage. Para producción:

- [ ] Implementar backend con base de datos real
- [ ] Agregar autenticación segura (JWT, OAuth)
- [ ] Validación de datos en servidor
- [ ] Protección CSRF
- [ ] Rate limiting
- [ ] Encriptación de datos sensibles

## Próximas Mejoras Sugeridas

- [ ] Reportes y estadísticas avanzadas
- [ ] Exportación de datos (PDF, Excel)
- [ ] Notificaciones push
- [ ] Integración con pasarelas de pago reales
- [ ] Sistema de cupones y descuentos
- [ ] Gestión de múltiples cafeterías
- [ ] App móvil nativa
- [ ] Impresión de tickets

## Soporte

Para preguntas o reportes de bugs, crear un issue en el repositorio.

## Licencia

Este proyecto es de código abierto bajo licencia MIT.

---

Desarrollado con ❤️ usando Next.js y shadcn/ui
