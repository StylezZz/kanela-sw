# Ejemplos de Integración con Backend

Este documento muestra ejemplos prácticos de cómo usar las APIs en los componentes.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Autenticación](#autenticación)
3. [Gestión de Productos](#gestión-de-productos)
4. [Creación de Órdenes](#creación-de-órdenes)
5. [Sistema de Crédito](#sistema-de-crédito)
6. [Manejo de Errores](#manejo-de-errores)

---

## Configuración Inicial

### 1. Configurar Variables de Entorno

Crear archivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Importar API en Componentes

```typescript
import { api } from '@/lib/api';
import type { Product, Order, User } from '@/lib/types';
```

---

## Autenticación

### Login Component

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Llamada al endpoint de login
      const { user, token } = await api.auth.login({ email, password });

      // El token ya se guarda automáticamente en localStorage
      toast.success(`Bienvenido ${user.full_name}`);
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### Obtener Usuario Actual

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        // Redirigir al login si no está autenticado
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.full_name}</h1>
      <p>Email: {user.email}</p>
      <p>Balance: S/ {user.current_balance.toFixed(2)}</p>
    </div>
  );
}
```

### Logout

```typescript
const handleLogout = async () => {
  try {
    await api.auth.logout();
    toast.success('Sesión cerrada');
    router.push('/login');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};
```

---

## Gestión de Productos

### Listar Productos

```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await api.products.getAll({
          page,
          limit: 12,
          available_only: true
        });

        setProducts(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [page]);

  if (loading) return <div>Cargando productos...</div>;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>

      {/* Paginación */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Anterior
        </button>
        <span>Página {page} de {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

### Crear/Editar Producto (Admin)

```typescript
const handleCreateProduct = async () => {
  try {
    const newProduct = await api.products.create({
      category_id: selectedCategoryId,
      name: 'Hamburguesa Clásica',
      description: 'Deliciosa hamburguesa con queso',
      price: 8.50,
      stock_quantity: 50,
      min_stock_level: 10,
      is_available: true,
      preparation_time: 15
    });

    toast.success('Producto creado exitosamente');
    // Actualizar lista de productos
  } catch (error) {
    toast.error('Error al crear producto');
  }
};

const handleUpdateProduct = async (productId: string) => {
  try {
    const updatedProduct = await api.products.update(productId, {
      price: 9.00,
      stock_quantity: 45
    });

    toast.success('Producto actualizado');
  } catch (error) {
    toast.error('Error al actualizar producto');
  }
};
```

### Filtrar por Categoría

```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('');

const loadProductsByCategory = async (categoryId: string) => {
  try {
    const response = await api.products.getAll({
      category_id: categoryId,
      available_only: true
    });

    setProducts(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Creación de Órdenes

### Proceso Completo de Orden

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { CreateOrderDTO, PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

export function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // Obtener usuario actual
      const user = await api.auth.getCurrentUser();

      // Crear la orden
      const orderData: CreateOrderDTO = {
        user_id: user.user_id,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        notes: notes || undefined
      };

      const order = await api.orders.create(orderData);

      toast.success(`Orden #${order.order_number} creada exitosamente`);

      // Limpiar carrito
      setCart([]);

      // Redirigir a mis pedidos
      router.push('/my-orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear orden');
    } finally {
      setIsProcessing(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div>
      <h1>Checkout</h1>

      {/* Lista de items del carrito */}
      <div>
        {cart.map((item, index) => (
          <div key={index}>
            {/* Renderizar item */}
          </div>
        ))}
      </div>

      {/* Método de pago */}
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
      >
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="credit">Fiado</option>
      </select>

      {/* Notas */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas adicionales..."
      />

      {/* Total */}
      <div>Total: S/ {total.toFixed(2)}</div>

      {/* Botón de confirmar */}
      <button
        onClick={handleCheckout}
        disabled={isProcessing || cart.length === 0}
      >
        {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
      </button>
    </div>
  );
}
```

### Ver Mis Órdenes

```typescript
const [myOrders, setMyOrders] = useState<Order[]>([]);

const loadMyOrders = async () => {
  try {
    const response = await api.orders.getMyOrders({
      page: 1,
      limit: 10
    });

    setMyOrders(response.data);
  } catch (error) {
    console.error('Error al cargar órdenes:', error);
  }
};
```

### Actualizar Estado de Orden (Admin)

```typescript
const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const updatedOrder = await api.orders.updateStatus(orderId, newStatus);
    toast.success(`Orden actualizada a ${newStatus}`);
  } catch (error) {
    toast.error('Error al actualizar orden');
  }
};

const handleCancelOrder = async (orderId: string, reason: string) => {
  try {
    await api.orders.cancel(orderId, reason);
    toast.success('Orden cancelada');
  } catch (error) {
    toast.error('Error al cancelar orden');
  }
};
```

---

## Sistema de Crédito

### Ver Balance y Realizar Pago

```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { User, CreditHistory } from '@/lib/types';

export function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await api.auth.getCurrentUser();
        setUser(currentUser);

        const creditHistory = await api.users.getCreditHistory(currentUser.user_id);
        setHistory(creditHistory);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    loadData();
  }, []);

  const handlePayment = async () => {
    if (!user) return;

    try {
      const payment = await api.creditPayments.create({
        user_id: user.user_id,
        amount: parseFloat(paymentAmount),
        payment_method: 'cash',
        notes: 'Pago registrado desde app'
      });

      toast.success('Pago registrado correctamente');

      // Actualizar usuario
      const updatedUser = await api.auth.getCurrentUser();
      setUser(updatedUser);

      // Recargar historial
      const updatedHistory = await api.users.getCreditHistory(user.user_id);
      setHistory(updatedHistory);

      setPaymentAmount('');
    } catch (error) {
      toast.error('Error al registrar pago');
    }
  };

  if (!user) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Mi Cuenta</h1>

      {/* Balance actual */}
      <div className={user.current_balance < 0 ? 'text-red-600' : 'text-green-600'}>
        <h2>Balance: S/ {user.current_balance.toFixed(2)}</h2>
        {user.has_credit_account && (
          <p>Límite de crédito: S/ {user.credit_limit.toFixed(2)}</p>
        )}
      </div>

      {/* Realizar pago si tiene deuda */}
      {user.current_balance < 0 && (
        <div>
          <h3>Realizar Pago</h3>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Monto a pagar"
            step="0.01"
          />
          <button onClick={handlePayment}>Registrar Pago</button>
        </div>
      )}

      {/* Historial */}
      <div>
        <h3>Historial de Movimientos</h3>
        {history.map((item) => (
          <div key={item.history_id}>
            <p>{item.description}</p>
            <p className={item.amount > 0 ? 'text-green-600' : 'text-red-600'}>
              {item.amount > 0 ? '+' : ''}S/ {item.amount.toFixed(2)}
            </p>
            <p>Balance: S/ {item.balance_after.toFixed(2)}</p>
            <small>{new Date(item.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Manejo de Errores

### Hook Personalizado para API Calls

```typescript
import { useState } from 'react';
import { toast } from 'sonner';

export function useApiCall<T>(
  apiCall: () => Promise<T>,
  onSuccess?: (data: T) => void
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
}

// Uso:
const { loading, execute } = useApiCall(
  () => api.products.getAll({ page: 1, limit: 20 }),
  (products) => {
    console.log('Productos cargados:', products);
  }
);

// Llamar cuando sea necesario
await execute();
```

### Interceptor de Errores Global

```typescript
// lib/api-interceptor.ts
import { removeAuthToken } from './config';

export async function handleApiError(error: any) {
  // Si es error 401, cerrar sesión
  if (error.status === 401) {
    removeAuthToken();
    window.location.href = '/login';
    return;
  }

  // Si es error 403, mostrar mensaje de permisos
  if (error.status === 403) {
    toast.error('No tienes permisos para realizar esta acción');
    return;
  }

  // Otros errores
  throw error;
}
```

---

## Tips y Mejores Prácticas

### 1. Usar React Query (Recomendado)

```bash
npm install @tanstack/react-query
```

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Consultar productos
function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { page: 1 }],
    queryFn: () => api.products.getAll({ page: 1, limit: 20 })
  });

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map(product => (
        <ProductCard key={product.product_id} product={product} />
      ))}
    </div>
  );
}

// Crear producto
function CreateProductForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      // Invalidar y refrescar
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado');
    }
  });

  const handleSubmit = (data: CreateProductDTO) => {
    mutation.mutate(data);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. Validación con Zod

```typescript
import { z } from 'zod';

const createProductSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(3).max(255),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

// Validar antes de enviar
const result = createProductSchema.safeParse(formData);
if (!result.success) {
  toast.error(result.error.errors[0].message);
  return;
}

await api.products.create(result.data);
```

### 3. Caché Local

```typescript
// Cachear respuestas para mejorar performance
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, { data: any; timestamp: number }>();

export async function cachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
    return cached.data;
  }

  const data = await apiCall();
  cache.set(key, { data, timestamp: Date.now() });

  return data;
}

// Uso:
const products = await cachedApiCall(
  'products-page-1',
  () => api.products.getAll({ page: 1 })
);
```

---

## Resumen

Este documento cubre los casos de uso más comunes. Para más detalles sobre cada endpoint, consulta `API_DOCUMENTATION.md`.

**Importante**: Asegúrate de configurar correctamente la variable de entorno `NEXT_PUBLIC_API_URL` antes de comenzar.
