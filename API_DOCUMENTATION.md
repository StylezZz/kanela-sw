# Documentación de API - Kanela Backend

Este documento describe todos los endpoints que el backend debe implementar para que el frontend funcione correctamente.

## Configuración

1. Copiar `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

2. Configurar la URL de tu backend en `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional"
}
```

### Respuesta con Error
```json
{
  "success": false,
  "error": "Descripción del error",
  "message": "Mensaje adicional"
}
```

### Respuesta Paginada
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Endpoints Requeridos

### 🔐 AUTENTICACIÓN

#### POST /auth/login
Login de usuario
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ...User },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/logout
Cerrar sesión
```json
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

#### GET /auth/me
Obtener usuario actual
```json
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": { ...User }
}
```

#### POST /auth/refresh
Refrescar token
```json
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": {
    "token": "new_jwt_token"
  }
}
```

---

### 👥 USUARIOS

#### GET /users
Obtener todos los usuarios (Admin)
```
Query Params:
  - page: number (default: 1)
  - limit: number (default: 20)
  - role: 'admin' | 'customer'

Headers: { "Authorization": "Bearer {token}" }

Response: PaginatedResponse<User>
```

#### GET /users/:id
Obtener usuario por ID
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": { ...User }
}
```

#### POST /users
Crear nuevo usuario (Admin)
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "email": "nuevo@example.com",
  "password": "password123",
  "full_name": "Juan Pérez",
  "phone": "+51999999999",
  "role": "customer",
  "has_credit_account": true,
  "credit_limit": 100.00
}

Response:
{
  "success": true,
  "data": { ...User }
}
```

#### PUT /users/:id
Actualizar usuario
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "full_name": "Juan Pérez Actualizado",
  "phone": "+51999999999",
  "account_status": "active"
}

Response:
{
  "success": true,
  "data": { ...User }
}
```

#### DELETE /users/:id
Eliminar usuario (Admin)
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Usuario eliminado"
}
```

#### GET /users/:id/credit-history
Obtener historial de crédito del usuario
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": [ ...CreditHistory ]
}
```

---

### 📁 CATEGORÍAS

#### GET /categories
Obtener todas las categorías
```
Query Params:
  - active_only: boolean (default: false)

Response:
{
  "success": true,
  "data": [ ...Category ]
}
```

#### GET /categories/:id
Obtener categoría por ID
```
Response:
{
  "success": true,
  "data": { ...Category }
}
```

#### POST /categories
Crear nueva categoría (Admin)
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "name": "Bebidas",
  "description": "Bebidas frías y calientes",
  "icon_url": "https://...",
  "display_order": 1,
  "is_active": true
}

Response:
{
  "success": true,
  "data": { ...Category }
}
```

#### PUT /categories/:id
Actualizar categoría (Admin)
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "name": "Bebidas Actualizadas"
}

Response:
{
  "success": true,
  "data": { ...Category }
}
```

#### DELETE /categories/:id
Eliminar categoría (Admin)
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Categoría eliminada"
}
```

---

### 📦 PRODUCTOS

#### GET /products
Obtener todos los productos
```
Query Params:
  - page: number (default: 1)
  - limit: number (default: 20)
  - category_id: string (UUID)
  - available_only: boolean
  - low_stock: boolean (productos con stock bajo)

Response: PaginatedResponse<Product>
```

#### GET /products/:id
Obtener producto por ID
```
Response:
{
  "success": true,
  "data": {
    ...Product,
    "category": { ...Category }
  }
}
```

#### POST /products
Crear nuevo producto (Admin)
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "category_id": "uuid",
  "name": "Hamburguesa",
  "description": "Hamburguesa clásica",
  "price": 8.50,
  "image_url": "https://...",
  "thumbnail_url": "https://...",
  "stock_quantity": 50,
  "min_stock_level": 10,
  "is_available": true,
  "preparation_time": 15,
  "calories": 450,
  "allergens": ["gluten", "lactosa"]
}

Response:
{
  "success": true,
  "data": { ...Product }
}
```

#### PUT /products/:id
Actualizar producto (Admin)
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "price": 9.00,
  "stock_quantity": 45
}

Response:
{
  "success": true,
  "data": { ...Product }
}
```

#### DELETE /products/:id
Eliminar producto (Admin)
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Producto eliminado"
}
```

#### GET /products/:id/inventory-movements
Obtener movimientos de inventario del producto
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": [ ...InventoryMovement ]
}
```

---

### 🛒 ÓRDENES

#### GET /orders
Obtener todas las órdenes (Admin)
```
Query Params:
  - page: number
  - limit: number
  - status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  - user_id: string (UUID)
  - start_date: string (ISO 8601)
  - end_date: string (ISO 8601)

Headers: { "Authorization": "Bearer {token}" }

Response: PaginatedResponse<Order>
```

#### GET /orders/:id
Obtener orden por ID
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": {
    ...Order,
    "user": { ...User },
    "items": [ ...OrderItem ]
  }
}
```

#### POST /orders
Crear nueva orden
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "user_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "customizations": "Sin cebolla"
    }
  ],
  "payment_method": "cash" | "card" | "credit",
  "notes": "Entregar en recepción"
}

Response:
{
  "success": true,
  "data": {
    ...Order,
    "items": [ ...OrderItem ]
  }
}

Notas:
- El backend debe calcular automáticamente el total_amount
- Si payment_method es "credit", debe marcar is_credit_order=true
- Debe actualizar el current_balance del usuario si es orden a crédito
- Debe crear registros en credit_history
- Debe actualizar el stock de los productos
```

#### PATCH /orders/:id/status
Actualizar estado de orden (Admin)
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "status": "confirmed" | "preparing" | "ready" | "delivered",
  "cancellation_reason": "Razón si es cancelada"
}

Response:
{
  "success": true,
  "data": { ...Order }
}

Notas:
- Debe actualizar los campos confirmed_at, ready_at, delivered_at según el estado
- Si el estado es "cancelled", debe revertir el stock
```

#### POST /orders/:id/cancel
Cancelar orden
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "reason": "Cliente canceló la orden"
}

Response:
{
  "success": true,
  "data": { ...Order }
}
```

#### GET /orders/my-orders
Obtener órdenes del usuario actual
```
Query Params:
  - page: number
  - limit: number

Headers: { "Authorization": "Bearer {token}" }

Response: PaginatedResponse<Order>
```

---

### 💰 PAGOS DE CRÉDITO

#### GET /credit-payments
Obtener todos los pagos de crédito (Admin)
```
Query Params:
  - page: number
  - limit: number
  - user_id: string (UUID)

Headers: { "Authorization": "Bearer {token}" }

Response: PaginatedResponse<CreditPayment>
```

#### POST /credit-payments
Crear nuevo pago de crédito
```json
Headers: { "Authorization": "Bearer {token}" }

Request:
{
  "user_id": "uuid",
  "order_id": "uuid (opcional)",
  "amount": 50.00,
  "payment_method": "cash" | "card" | "transfer",
  "transaction_reference": "REF123",
  "notes": "Pago parcial"
}

Response:
{
  "success": true,
  "data": { ...CreditPayment }
}

Notas:
- Debe actualizar el current_balance del usuario
- Debe crear registro en credit_history
- Debe calcular balance_before y balance_after
```

#### GET /credit-payments/my-payments
Obtener pagos del usuario actual
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": [ ...CreditPayment ]
}
```

---

### 🔔 NOTIFICACIONES

#### GET /notifications
Obtener notificaciones del usuario actual
```
Query Params:
  - unread_only: boolean (default: false)

Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": [ ...Notification ]
}
```

#### PATCH /notifications/:id/read
Marcar notificación como leída
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

#### PATCH /notifications/mark-all-read
Marcar todas las notificaciones como leídas
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas"
}
```

#### DELETE /notifications/:id
Eliminar notificación
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "message": "Notificación eliminada"
}
```

---

### 📊 DASHBOARD / ESTADÍSTICAS

#### GET /dashboard/stats
Obtener estadísticas del dashboard (Admin)
```
Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": {
    "totalSales": 5000.00,
    "todaySales": 250.00,
    "pendingOrders": 12,
    "totalCustomers": 150,
    "totalCreditDebt": 1200.00,
    "lowStockProducts": 5,
    "topProducts": [
      {
        "product_id": "uuid",
        "product_name": "Hamburguesa",
        "total_quantity": 120,
        "total_revenue": 1020.00
      }
    ]
  }
}
```

#### GET /dashboard/sales-report
Obtener reporte de ventas (Admin)
```
Query Params:
  - start_date: string (ISO 8601)
  - end_date: string (ISO 8601)

Headers: { "Authorization": "Bearer {token}" }

Response:
{
  "success": true,
  "data": {
    "sales_by_day": [ ... ],
    "sales_by_product": [ ... ],
    "sales_by_payment_method": [ ... ]
  }
}
```

---

## Autenticación

Todos los endpoints (excepto `/auth/login`) requieren el header:
```
Authorization: Bearer {token}
```

## Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Notas Importantes

1. **UUIDs**: Todos los IDs son UUIDs v4
2. **Timestamps**: Usar formato ISO 8601 (`2025-01-15T10:30:00Z`)
3. **Moneda**: Usar `numeric(10,2)` para valores monetarios
4. **Paginación**: Por defecto `page=1, limit=20`
5. **Triggers**: El backend debe manejar triggers para:
   - Generar order_number automáticamente
   - Actualizar current_balance en users
   - Crear registros en credit_history
   - Actualizar stock en products
   - Crear notificaciones automáticas

## Ejemplo de Uso en Frontend

```typescript
import { api } from '@/lib/api';

// Login
const { user, token } = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Obtener productos
const products = await api.products.getAll({
  page: 1,
  limit: 20,
  available_only: true
});

// Crear orden
const order = await api.orders.create({
  user_id: user.user_id,
  items: [
    { product_id: 'uuid-123', quantity: 2 }
  ],
  payment_method: 'credit',
  notes: 'Sin cebolla'
});

// Registrar pago
const payment = await api.creditPayments.create({
  user_id: user.user_id,
  amount: 50.00,
  payment_method: 'cash'
});
```
