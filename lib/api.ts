import { API_CONFIG, getAuthHeaders, setAuthToken, removeAuthToken } from './config';
import type {
  User,
  CreateUserDTO,
  UpdateUserDTO,
  LoginDTO,
  LoginResponse,
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
  ApiResponse,
  PaginatedResponse,
} from './types';

// ==================== HELPER FUNCTIONS ====================

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    const errorData = isJson ? await response.json() : { error: response.statusText };
    throw new Error(errorData.error || errorData.message || 'Error en la petición');
  }

  if (isJson) {
    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  }

  return { success: true } as ApiResponse<T>;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== AUTENTICACIÓN ====================

export const authApi = {
  /**
   * Login de usuario
   * POST /auth/login
   */
  login: async (credentials: LoginDTO): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response.data!;
  },

  /**
   * Logout de usuario
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {
    await apiRequest('/auth/logout', { method: 'POST' });
    removeAuthToken();
  },

  /**
   * Obtener usuario actual
   * GET /auth/me
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiRequest<User>('/auth/me');
    return response.data!;
  },

  /**
   * Refrescar token
   * POST /auth/refresh
   */
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiRequest<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });

    if (response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response.data!;
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
  }): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);

    const response = await apiRequest<PaginatedResponse<User>>(
      `/users?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Obtener usuario por ID
   * GET /users/:id
   */
  getById: async (userId: string): Promise<User> => {
    const response = await apiRequest<User>(`/users/${userId}`);
    return response.data!;
  },

  /**
   * Crear nuevo usuario
   * POST /users
   */
  create: async (userData: CreateUserDTO): Promise<User> => {
    const response = await apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data!;
  },

  /**
   * Actualizar usuario
   * PUT /users/:id
   */
  update: async (userId: string, userData: UpdateUserDTO): Promise<User> => {
    const response = await apiRequest<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data!;
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
    const response = await apiRequest<CreditHistory[]>(
      `/users/${userId}/credit-history`
    );
    return response.data!;
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

    const response = await apiRequest<Category[]>(
      `/categories?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Obtener categoría por ID
   * GET /categories/:id
   */
  getById: async (categoryId: string): Promise<Category> => {
    const response = await apiRequest<Category>(`/categories/${categoryId}`);
    return response.data!;
  },

  /**
   * Crear nueva categoría
   * POST /categories
   */
  create: async (categoryData: CreateCategoryDTO): Promise<Category> => {
    const response = await apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return response.data!;
  },

  /**
   * Actualizar categoría
   * PUT /categories/:id
   */
  update: async (
    categoryId: string,
    categoryData: Partial<CreateCategoryDTO>
  ): Promise<Category> => {
    const response = await apiRequest<Category>(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    return response.data!;
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
  }): Promise<PaginatedResponse<Product>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.available_only) queryParams.append('available_only', 'true');
    if (params?.low_stock) queryParams.append('low_stock', 'true');

    const response = await apiRequest<PaginatedResponse<Product>>(
      `/products?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Obtener producto por ID
   * GET /products/:id
   */
  getById: async (productId: string): Promise<Product> => {
    const response = await apiRequest<Product>(`/products/${productId}`);
    return response.data!;
  },

  /**
   * Crear nuevo producto
   * POST /products
   */
  create: async (productData: CreateProductDTO): Promise<Product> => {
    const response = await apiRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response.data!;
  },

  /**
   * Actualizar producto
   * PUT /products/:id
   */
  update: async (
    productId: string,
    productData: UpdateProductDTO
  ): Promise<Product> => {
    const response = await apiRequest<Product>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return response.data!;
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
  getInventoryMovements: async (
    productId: string
  ): Promise<InventoryMovement[]> => {
    const response = await apiRequest<InventoryMovement[]>(
      `/products/${productId}/inventory-movements`
    );
    return response.data!;
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
  }): Promise<PaginatedResponse<Order>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await apiRequest<PaginatedResponse<Order>>(
      `/orders?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Obtener orden por ID
   * GET /orders/:id
   */
  getById: async (orderId: string): Promise<Order> => {
    const response = await apiRequest<Order>(`/orders/${orderId}`);
    return response.data!;
  },

  /**
   * Crear nueva orden
   * POST /orders
   */
  create: async (orderData: CreateOrderDTO): Promise<Order> => {
    const response = await apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response.data!;
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
    const response = await apiRequest<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellation_reason }),
    });
    return response.data!;
  },

  /**
   * Cancelar orden
   * POST /orders/:id/cancel
   */
  cancel: async (orderId: string, reason: string): Promise<Order> => {
    const response = await apiRequest<Order>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data!;
  },

  /**
   * Obtener órdenes del usuario actual
   * GET /orders/my-orders
   */
  getMyOrders: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiRequest<PaginatedResponse<Order>>(
      `/orders/my-orders?${queryParams}`
    );
    return response.data!;
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
  }): Promise<PaginatedResponse<CreditPayment>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const response = await apiRequest<PaginatedResponse<CreditPayment>>(
      `/credit-payments?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Crear nuevo pago de crédito
   * POST /credit-payments
   */
  create: async (paymentData: CreateCreditPaymentDTO): Promise<CreditPayment> => {
    const response = await apiRequest<CreditPayment>('/credit-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response.data!;
  },

  /**
   * Obtener pagos de crédito del usuario actual
   * GET /credit-payments/my-payments
   */
  getMyPayments: async (): Promise<CreditPayment[]> => {
    const response = await apiRequest<CreditPayment[]>(
      '/credit-payments/my-payments'
    );
    return response.data!;
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

    const response = await apiRequest<Notification[]>(
      `/notifications?${queryParams}`
    );
    return response.data!;
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
    const response = await apiRequest<DashboardStats>('/dashboard/stats');
    return response.data!;
  },

  /**
   * Obtener reporte de ventas
   * GET /dashboard/sales-report
   */
  getSalesReport: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await apiRequest<any>(`/dashboard/sales-report?${queryParams}`);
    return response.data!;
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
