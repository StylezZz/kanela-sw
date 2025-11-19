/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_CONFIG, getAuthHeaders, setAuthToken, removeAuthToken } from './config';
import type {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  LoginDTO,
  Category,
  CreateCategoryDTO,
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  Order,
  CreateOrderDTO,
  CreditPayment,
  CreateCreditPaymentDTO,
  CreditHistory,
  Notification,
  InventoryMovement,
  DashboardStats,
  BackendResponse,
} from './types';

// ==================== HELPER PARA HACER REQUESTS ====================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log('📦 Body:', options.body);
    }
    
    const response = await fetch(url, config);
    const data: BackendResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Error en la petición');
    }

    return data as T;
  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Si el error es un objeto Error, lanzarlo tal cual
    if (error instanceof Error) {
      throw error;
    }
    
    // Si es otro tipo de error, convertirlo a string
    throw new Error(String(error));
  }
}

// ==================== AUTENTICACIÓN ====================

export const authApi = {
  /**
   * Login de usuario
   * POST /auth/login
   */
  login: async (credentials: LoginDTO) => {
    const response = await apiRequest<BackendResponse<{ user: User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const token = response.token!;
    const user = response.data!.user;

    // Guardar token automáticamente
    setAuthToken(token);

    return { user, token };
  },

  /**
   * Logout de usuario
   * POST /auth/logout
   */
  logout: async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    removeAuthToken();
  },

  /**
   * Obtener usuario actual
   * GET /auth/me
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>('/auth/me');
    return response.data!.user;
  },

  /**
   * Refrescar token
   * POST /auth/refresh
   */
  refreshToken: async () => {
    const response = await apiRequest<BackendResponse<{ token: string }>>('/auth/refresh', {
      method: 'POST',
    });

    const token = response.data!.token;
    setAuthToken(token);

    return { token };
  },
};

// ==================== USUARIOS ====================

export const usersApi = {
  /**
   * Obtener todos los usuarios
   * GET /users
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<{ users: User[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);

    const response = await apiRequest<BackendResponse<{ users: User[] }>>(
      `/users?${queryParams}`
    );

    return {
      users: response.data!.users,
      count: response.count || 0,
    };
  },

  /**
   * Obtener usuario por ID
   * GET /users/:id
   */
  getById: async (userId: string): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>(`/users/${userId}`);
    return response.data!.user;
  },

  /**
   * Crear nuevo usuario
   * POST /users
   */
  create: async (userData: CreateUserDTO): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data!.user;
  },

  /**
   * Actualizar usuario
   * PUT /users/:id
   */
  update: async (userId: string, userData: UpdateUserDTO): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data!.user;
  },

  /**
   * Eliminar usuario
   * DELETE /users/:id
   */
  delete: async (userId: string): Promise<void> => {
    await apiRequest(`/users/${userId}`, { method: 'DELETE' });
  },

  /**
   * Obtener historial de crédito del usuario
   * GET /users/:id/credit-history
   */
  getCreditHistory: async (userId: string): Promise<CreditHistory[]> => {
    const response = await apiRequest<BackendResponse<{ history: CreditHistory[] }>>(
      `/users/${userId}/credit-history`
    );
    return response.data!.history;
  },

  /**
   * Carga masiva de usuarios mediante archivo Excel
   * POST /users/bulk-upload
   */
  bulkUpload: async (file: File): Promise<{ created: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_CONFIG.BASE_URL}/users/bulk-upload`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    const data: BackendResponse<{ created: number; errors: string[] }> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Error en la carga masiva');
    }

    return data.data!;
  },
};

// ==================== CATEGORÍAS ====================

export const categoriesApi = {
  /**
   * Obtener todas las categorías
   * GET /categories
   */
  getAll: async (params?: { active_only?: boolean }): Promise<Category[]> => {
    const queryParams = new URLSearchParams();
    if (params?.active_only) queryParams.append('active_only', 'true');

    const response = await apiRequest<BackendResponse<{ categories: Category[] }>>(
      `/categories`
    );
    return response.data!.categories;
  },

  /**
   * Obtener categoría por ID
   * GET /categories/:id
   */
  getById: async (categoryId: string): Promise<Category> => {
    const response = await apiRequest<BackendResponse<{ category: Category }>>(
      `/categories/${categoryId}`
    );
    return response.data!.category;
  },

  /**
   * Crear nueva categoría
   * POST /categories
   */
  create: async (categoryData: CreateCategoryDTO): Promise<Category> => {
    const response = await apiRequest<BackendResponse<{ category: Category }>>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return response.data!.category;
  },

  /**
   * Actualizar categoría
   * PUT /categories/:id
   */
  update: async (
    categoryId: string,
    categoryData: Partial<CreateCategoryDTO>
  ): Promise<Category> => {
    const response = await apiRequest<BackendResponse<{ category: Category }>>(
      `/categories/${categoryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      }
    );
    return response.data!.category;
  },

  /**
   * Eliminar categoría
   * DELETE /categories/:id
   */
  delete: async (categoryId: string): Promise<void> => {
    await apiRequest(`/categories/${categoryId}`, { method: 'DELETE' });
  },
};

// ==================== PRODUCTOS ====================

export const productsApi = {
  /**
   * Obtener todos los productos
   * GET /products
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category_id?: string;
    available_only?: boolean;
    low_stock?: boolean;
  }): Promise<{ products: Product[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.available_only) queryParams.append('available_only', 'true');
    if (params?.low_stock) queryParams.append('low_stock', 'true');

    const response = await apiRequest<BackendResponse<{ products: Product[] }>>(
      `/products?${queryParams}`
    );

    return {
      products: response.data!.products,
      count: response.count || 0,
    };
  },

  /**
   * Obtener producto por ID
   * GET /products/:id
   */
  getById: async (productId: string): Promise<Product> => {
    const response = await apiRequest<BackendResponse<{ product: Product }>>(
      `/products/${productId}`
    );
    return response.data!.product;
  },

  /**
   * Crear nuevo producto
   * POST /products
   */
  create: async (productData: CreateProductDTO): Promise<Product> => {
    const response = await apiRequest<BackendResponse<{ product: Product }>>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response.data!.product;
  },

  /**
   * Actualizar producto
   * PUT /products/:id
   */
  update: async (productId: string, productData: UpdateProductDTO): Promise<Product> => {
    const response = await apiRequest<BackendResponse<{ product: Product }>>(
      `/products/${productId}`,
      {
        method: 'PUT',
        body: JSON.stringify(productData),
      }
    );
    return response.data!.product;
  },

  /**
   * Eliminar producto
   * DELETE /products/:id
   */
  delete: async (productId: string): Promise<void> => {
    await apiRequest(`/products/${productId}`, { method: 'DELETE' });
  },

  /**
   * Obtener movimientos de inventario de un producto
   * GET /products/:id/inventory-movements
   */
  getInventoryMovements: async (productId: string): Promise<InventoryMovement[]> => {
    const response = await apiRequest<BackendResponse<{ movements: InventoryMovement[] }>>(
      `/products/${productId}/inventory-movements`
    );
    return response.data!.movements;
  },
};

// ==================== ÓRDENES ====================

export const ordersApi = {
  /**
   * Obtener todas las órdenes
   * GET /orders
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Obtener orden por ID
   * GET /orders/:id
   */
  getById: async (orderId: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(`/orders/${orderId}`);
    return response.data!.order;
  },

  /**
   * Crear nueva orden
   * POST /orders
   */
  create: async (orderData: CreateOrderDTO): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response.data!.order;
  },

  /**
   * Actualizar estado de orden
   * PATCH /orders/:id/status
   */
  updateStatus: async (
    orderId: string,
    status: string,
    cancellation_reason?: string
  ): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, cancellation_reason }),
      }
    );
    return response.data!.order;
  },

  /**
   * Cancelar orden
   * POST /orders/:id/cancel
   */
  cancel: async (orderId: string, reason: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return response.data!.order;
  },

  /**
   * Obtener órdenes del usuario actual
   * GET /orders/my-orders
   */
  getMyOrders: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders/my-orders?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },
};

// ==================== PAGOS DE CRÉDITO ====================

export const creditPaymentsApi = {
  /**
   * Obtener todos los pagos de crédito
   * GET /credit-payments
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    user_id?: string;
  }): Promise<{ payments: CreditPayment[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const response = await apiRequest<BackendResponse<{ payments: CreditPayment[] }>>(
      `/credit-payments?${queryParams}`
    );

    return {
      payments: response.data!.payments,
      count: response.count || 0,
    };
  },

  /**
   * Crear nuevo pago de crédito
   * POST /credit-payments
   */
  create: async (paymentData: CreateCreditPaymentDTO): Promise<CreditPayment> => {
    const response = await apiRequest<BackendResponse<{ payment: CreditPayment }>>(
      '/credit-payments',
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );
    return response.data!.payment;
  },

  /**
   * Obtener pagos de crédito del usuario actual
   * GET /credit-payments/my-payments
   */
  getMyPayments: async (): Promise<CreditPayment[]> => {
    const response = await apiRequest<BackendResponse<{ payments: CreditPayment[] }>>(
      '/credit-payments/my-payments'
    );
    return response.data!.payments;
  },
};

// ==================== NOTIFICACIONES ====================

export const notificationsApi = {
  /**
   * Obtener notificaciones del usuario actual
   * GET /notifications
   */
  getMy: async (params?: { unread_only?: boolean }): Promise<Notification[]> => {
    const queryParams = new URLSearchParams();
    if (params?.unread_only) queryParams.append('unread_only', 'true');

    const response = await apiRequest<BackendResponse<{ notifications: Notification[] }>>(
      `/notifications?${queryParams}`
    );
    return response.data!.notifications;
  },

  /**
   * Marcar notificación como leída
   * PATCH /notifications/:id/read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Marcar todas las notificaciones como leídas
   * PATCH /notifications/mark-all-read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiRequest('/notifications/mark-all-read', { method: 'PATCH' });
  },

  /**
   * Eliminar notificación
   * DELETE /notifications/:id
   */
  delete: async (notificationId: string): Promise<void> => {
    await apiRequest(`/notifications/${notificationId}`, { method: 'DELETE' });
  },
};

// ==================== DASHBOARD / ESTADÍSTICAS ====================

export const dashboardApi = {
  /**
   * Obtener estadísticas del dashboard
   * GET /dashboard/stats
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest<BackendResponse<{ stats: DashboardStats }>>(
      '/dashboard/stats'
    );
    return response.data!.stats;
  },

  /**
   * Obtener reporte de ventas
   * GET /dashboard/sales-report
   */
  getSalesReport: async (params?: { start_date?: string; end_date?: string }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await apiRequest<BackendResponse<{ report: any }>>(
      `/dashboard/sales-report?${queryParams}`
    );
    return response.data!.report;
  },
};

// ==================== EXPORTAR TODO ====================

export const api = {
  auth: authApi,
  users: usersApi,
  categories: categoriesApi,
  products: productsApi,
  orders: ordersApi,
  creditPayments: creditPaymentsApi,
  notifications: notificationsApi,
  dashboard: dashboardApi,
};

export default api;
