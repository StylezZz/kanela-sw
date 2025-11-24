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
  WeeklyMenuBackend,
  CreateWeeklyMenuDTO,
  UpdateWeeklyMenuDTO,
  MenuReservationBackend,
  CreateMenuReservationDTO,
  MenuWaitlist,
  MenuStats,
  MenuDemand,
  DemandReport,
  ImportMenusResult,
  ReservationStatus,
  MyAccountResponse,
  CreditAvailability,
  MyCreditPaymentDTO,
  AdminCreditPaymentDTO,
  CreditReport,
  PendingCreditOrder,
  UserWithDebt,
  DebtReportItem,
  MonthlySummary,
  EnableCreditDTO,
  UpdateCreditLimitDTO,
  AdjustDebtDTO,
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

  /**
   * Solicitar reset de contraseña
   * POST /auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<void> => {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Verificar si el token de reset es válido
   * GET /auth/verify-reset-token/:token
   */
  verifyResetToken: async (token: string): Promise<{ valid: boolean }> => {
    const response = await apiRequest<BackendResponse<{ valid: boolean }>>(
      `/auth/verify-reset-token/${token}`
    );
    return { valid: response.data?.valid ?? true };
  },

  /**
   * Cambiar contraseña con token
   * POST /auth/reset-password
   */
  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<void> => {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword }),
    });
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

  getTemplateFile: async(): Promise<Blob> => {
    const url = `${API_CONFIG.BASE_URL}/users/import/template`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al descargar la plantilla');
    }

    return await response.blob();
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

// Tipos específicos para órdenes
interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface OrderStats {
  total_orders: number;
  completed_orders?: number;
  delivered_orders?: number;
  cancelled_orders: number;
  credit_orders?: number;
  total_spent?: number;
  total_revenue?: number;
  credit_revenue?: number;
  avg_order_value: number;
}

interface OrderStatsSummary {
  stats: OrderStats;
  period?: {
    from: string;
    to: string;
  };
}

export const ordersApi = {
  // ========== ENDPOINTS PARA CLIENTES ==========

  /**
   * Crear pedido
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
   * Obtener mis pedidos (lista simple)
   * GET /orders/my-orders
   */
  getMyOrders: async (params?: {
    status?: string;
    payment_method?: string;
    include_items?: boolean;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders/my-orders?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Historial de mis pedidos (con paginación)
   * GET /orders/my-history
   */
  getMyHistory: async (params?: {
    page?: number;
    limit?: number;
    include_items?: boolean;
  }): Promise<{ orders: Order[]; pagination: OrderPagination }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[]; pagination: OrderPagination }>>(
      `/orders/my-history?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      pagination: response.data!.pagination,
    };
  },

  /**
   * Mis órdenes activas
   * GET /orders/my-active
   */
  getMyActive: async (params?: {
    include_items?: boolean;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders/my-active?${queryParams}`
    );
    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Mis estadísticas de pedidos
   * GET /orders/my-stats
   */
  getMyStats: async (): Promise<OrderStats> => {
    const response = await apiRequest<BackendResponse<{ stats: OrderStats }>>(
      '/orders/my-stats'
    );
    return response.data!.stats;
  },

  /**
   * Obtener detalle de pedido
   * GET /orders/:id
   */
  getById: async (orderId: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(`/orders/${orderId}`);
    return response.data!.order;
  },

  /**
   * Reordenar (repetir pedido anterior)
   * POST /orders/:id/reorder
   */
  reorder: async (orderId: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}/reorder`,
      { method: 'POST' }
    );
    return response.data!.order;
  },

  /**
   * Cancelar pedido (cliente)
   * DELETE /orders/:id
   */
  cancel: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      }
    );
    return response.data!.order;
  },

  // ========== ENDPOINTS PARA ADMINISTRADORES ==========

  /**
   * Obtener todos los pedidos
   * GET /orders
   */
  getAll: async (params?: {
    status?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    include_items?: boolean;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Pedidos con paginación y filtros avanzados
   * GET /orders/paginated
   */
  getPaginated: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    payment_method?: string;
    payment_status?: string;
    is_credit_order?: boolean;
    date_from?: string;
    date_to?: string;
    user_id?: string;
    search?: string;
    include_items?: boolean;
  }): Promise<{ orders: Order[]; pagination: OrderPagination }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.payment_status) queryParams.append('payment_status', params.payment_status);
    if (params?.is_credit_order !== undefined) queryParams.append('is_credit_order', params.is_credit_order.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[]; pagination: OrderPagination }>>(
      `/orders/paginated?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      pagination: response.data!.pagination,
    };
  },

  /**
   * Órdenes activas (panel de preparación)
   * GET /orders/active
   */
  getActive: async (params?: {
    include_items?: boolean;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders/active?${queryParams}`
    );
    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Órdenes del día
   * GET /orders/today
   */
  getToday: async (params?: {
    include_items?: boolean;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders/today?${queryParams}`
    );
    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Estadísticas de pedidos
   * GET /orders/stats/summary
   */
  getStatsSummary: async (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<OrderStatsSummary> => {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const response = await apiRequest<BackendResponse<OrderStatsSummary>>(
      `/orders/stats/summary?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Buscar por número de orden
   * GET /orders/search/:orderNumber
   */
  searchByOrderNumber: async (orderNumber: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/search/${orderNumber}`
    );
    return response.data!.order;
  },

  /**
   * Órdenes de un cliente específico
   * GET /orders/customer/:customerId
   */
  getByCustomer: async (customerId: string, params?: {
    status?: string;
    include_items?: boolean;
  }): Promise<{ orders: Order[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.include_items) queryParams.append('include_items', 'true');

    const response = await apiRequest<BackendResponse<{ orders: Order[] }>>(
      `/orders/customer/${customerId}?${queryParams}`
    );

    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Validar código QR
   * POST /orders/validate-qr
   */
  validateQR: async (qr_code: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      '/orders/validate-qr',
      {
        method: 'POST',
        body: JSON.stringify({ qr_code }),
      }
    );
    return response.data!.order;
  },

  /**
   * Actualizar estado del pedido
   * PATCH /orders/:id/status
   */
  updateStatus: async (orderId: string, status: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return response.data!.order;
  },

  /**
   * Actualizar notas del pedido
   * PATCH /orders/:id/notes
   */
  updateNotes: async (orderId: string, notes: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}/notes`,
      {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      }
    );
    return response.data!.order;
  },

  /**
   * Actualizar tiempo estimado
   * PATCH /orders/:id/estimated-time
   */
  updateEstimatedTime: async (orderId: string, estimated_ready_time: string): Promise<Order> => {
    const response = await apiRequest<BackendResponse<{ order: Order }>>(
      `/orders/${orderId}/estimated-time`,
      {
        method: 'PATCH',
        body: JSON.stringify({ estimated_ready_time }),
      }
    );
    return response.data!.order;
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

// ==================== MENÚS SEMANALES ====================

export const weeklyMenusApi = {
  // ========== ENDPOINTS PÚBLICOS ==========

  /**
   * Obtener todos los menús
   * GET /weekly-menus
   */
  getAll: async (params?: {
    active?: boolean;
    from_date?: string;
    to_date?: string;
    available?: boolean;
  }): Promise<{ menus: WeeklyMenuBackend[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.available !== undefined) queryParams.append('available', params.available.toString());

    const response = await apiRequest<BackendResponse<{ menus: WeeklyMenuBackend[] }>>(
      `/weekly-menus?${queryParams}`
    );
    return { menus: response.data!.menus, count: response.count || 0 };
  },

  /**
   * Obtener menús de la semana actual
   * GET /weekly-menus/current-week
   */
  getCurrentWeek: async (): Promise<WeeklyMenuBackend[]> => {
    const response = await apiRequest<BackendResponse<{ menus: WeeklyMenuBackend[] }>>(
      '/weekly-menus/current-week'
    );
    return response.data!.menus;
  },

  /**
   * Obtener menú por ID
   * GET /weekly-menus/:id
   */
  getById: async (menuId: string): Promise<WeeklyMenuBackend> => {
    const response = await apiRequest<BackendResponse<{ menu: WeeklyMenuBackend }>>(
      `/weekly-menus/${menuId}`
    );
    return response.data!.menu;
  },

  // ========== ENDPOINTS USUARIO AUTENTICADO ==========

  /**
   * Crear reservación
   * POST /weekly-menus/:id/reservations
   */
  createReservation: async (menuId: string, data: CreateMenuReservationDTO): Promise<MenuReservationBackend> => {
    const response = await apiRequest<BackendResponse<{ reservation: MenuReservationBackend }>>(
      `/weekly-menus/${menuId}/reservations`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data!.reservation;
  },

  /**
   * Obtener mis reservaciones
   * GET /weekly-menus/user/my-reservations
   */
  getMyReservations: async (status?: ReservationStatus): Promise<MenuReservationBackend[]> => {
    const queryParams = status ? `?status=${status}` : '';
    const response = await apiRequest<BackendResponse<{ reservations: MenuReservationBackend[] }>>(
      `/weekly-menus/user/my-reservations${queryParams}`
    );
    return response.data!.reservations;
  },

  /**
   * Cancelar mi reservación
   * PATCH /weekly-menus/reservations/:reservationId/cancel
   */
  cancelMyReservation: async (reservationId: string, reason?: string): Promise<void> => {
    await apiRequest(`/weekly-menus/reservations/${reservationId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Agregar a lista de espera
   * POST /weekly-menus/:id/waitlist
   */
  joinWaitlist: async (menuId: string, data: { quantity: number; notes?: string }): Promise<MenuWaitlist> => {
    const response = await apiRequest<BackendResponse<{ waitlist: MenuWaitlist }>>(
      `/weekly-menus/${menuId}/waitlist`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data!.waitlist;
  },

  /**
   * Obtener mi lista de espera
   * GET /weekly-menus/user/my-waitlist
   */
  getMyWaitlist: async (): Promise<MenuWaitlist[]> => {
    const response = await apiRequest<BackendResponse<{ waitlist: MenuWaitlist[] }>>(
      '/weekly-menus/user/my-waitlist'
    );
    return response.data!.waitlist;
  },

  /**
   * Cancelar entrada en lista de espera
   * DELETE /weekly-menus/waitlist/:waitlistId
   */
  leaveWaitlist: async (waitlistId: string): Promise<void> => {
    await apiRequest(`/weekly-menus/waitlist/${waitlistId}`, { method: 'DELETE' });
  },

  // ========== ENDPOINTS ADMIN ==========

  /**
   * Crear menú
   * POST /weekly-menus
   */
  create: async (data: CreateWeeklyMenuDTO): Promise<WeeklyMenuBackend> => {
    const response = await apiRequest<BackendResponse<{ menu: WeeklyMenuBackend }>>(
      '/weekly-menus',
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data!.menu;
  },

  /**
   * Actualizar menú
   * PUT /weekly-menus/:id
   */
  update: async (menuId: string, data: UpdateWeeklyMenuDTO): Promise<WeeklyMenuBackend> => {
    const response = await apiRequest<BackendResponse<{ menu: WeeklyMenuBackend }>>(
      `/weekly-menus/${menuId}`,
      { method: 'PUT', body: JSON.stringify(data) }
    );
    return response.data!.menu;
  },

  /**
   * Eliminar menú (soft delete)
   * DELETE /weekly-menus/:id
   */
  delete: async (menuId: string): Promise<void> => {
    await apiRequest(`/weekly-menus/${menuId}`, { method: 'DELETE' });
  },

  /**
   * Descargar plantilla Excel
   * GET /weekly-menus/template
   */
  getTemplate: async (): Promise<Blob> => {
    const url = `${API_CONFIG.BASE_URL}/weekly-menus/template`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Error al descargar plantilla');
    return response.blob();
  },

  /**
   * Importar menús desde Excel
   * POST /weekly-menus/import
   */
  importFromExcel: async (
    file: File,
    options?: { default_max_reservations?: number; hours_before_deadline?: number; skip_existing?: boolean }
  ): Promise<ImportMenusResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.default_max_reservations) formData.append('default_max_reservations', options.default_max_reservations.toString());
    if (options?.hours_before_deadline) formData.append('hours_before_deadline', options.hours_before_deadline.toString());
    if (options?.skip_existing !== undefined) formData.append('skip_existing', options.skip_existing.toString());

    const url = `${API_CONFIG.BASE_URL}/weekly-menus/import`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data: BackendResponse<ImportMenusResult> = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Error al importar');
    return data.data!;
  },

  /**
   * Ver reservaciones de un menú
   * GET /weekly-menus/:id/reservations
   */
  getMenuReservations: async (menuId: string, status?: ReservationStatus): Promise<{ reservations: MenuReservationBackend[]; stats: MenuStats }> => {
    const queryParams = status ? `?status=${status}` : '';
    const response = await apiRequest<BackendResponse<{ reservations: MenuReservationBackend[]; stats: MenuStats }>>(
      `/weekly-menus/${menuId}/reservations${queryParams}`
    );
    return response.data!;
  },

  /**
   * Estadísticas de un menú
   * GET /weekly-menus/:id/stats
   */
  getMenuStats: async (menuId: string): Promise<MenuStats> => {
    const response = await apiRequest<BackendResponse<{ stats: MenuStats }>>(
      `/weekly-menus/${menuId}/stats`
    );
    return response.data!.stats;
  },

  /**
   * Actualizar estado de reservación
   * PATCH /weekly-menus/reservations/:reservationId/status
   */
  updateReservationStatus: async (reservationId: string, status: ReservationStatus, reason?: string): Promise<MenuReservationBackend> => {
    const response = await apiRequest<BackendResponse<{ reservation: MenuReservationBackend }>>(
      `/weekly-menus/reservations/${reservationId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, reason }) }
    );
    return response.data!.reservation;
  },

  /**
   * Ver lista de espera de un menú
   * GET /weekly-menus/:id/waitlist
   */
  getMenuWaitlist: async (menuId: string): Promise<MenuWaitlist[]> => {
    const response = await apiRequest<BackendResponse<{ waitlist: MenuWaitlist[] }>>(
      `/weekly-menus/${menuId}/waitlist`
    );
    return response.data!.waitlist;
  },

  /**
   * Ver demanda de un menú
   * GET /weekly-menus/:id/demand
   */
  getMenuDemand: async (menuId: string): Promise<MenuDemand> => {
    const response = await apiRequest<BackendResponse<{ demand: MenuDemand }>>(
      `/weekly-menus/${menuId}/demand`
    );
    return response.data!.demand;
  },

  /**
   * Reporte de demanda general
   * GET /weekly-menus/demand/report
   */
  getDemandReport: async (params?: { from_date?: string; to_date?: string; unmet_only?: boolean }): Promise<DemandReport[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.unmet_only) queryParams.append('unmet_only', 'true');

    const response = await apiRequest<BackendResponse<{ report: DemandReport[] }>>(
      `/weekly-menus/demand/report?${queryParams}`
    );
    return response.data!.report;
  },

  /**
   * Aumentar cupo de un menú
   * PATCH /weekly-menus/:id/capacity
   */
  updateCapacity: async (menuId: string, max_reservations: number, notify_waitlist?: boolean): Promise<{ menu: WeeklyMenuBackend; newSpotsAvailable: number; notifiedUsers: any[] }> => {
    const response = await apiRequest<BackendResponse<{ menu: WeeklyMenuBackend; newSpotsAvailable: number; notifiedUsers: any[] }>>(
      `/weekly-menus/${menuId}/capacity`,
      { method: 'PATCH', body: JSON.stringify({ max_reservations, notify_waitlist }) }
    );
    return response.data!;
  },
};

// ==================== CRÉDITO ====================

export const creditApi = {
  // ========== ENDPOINTS PARA CLIENTES ==========

  /**
   * Obtener mi estado de cuenta
   * GET /api/credit/my-account
   */
  getMyAccount: async (): Promise<MyAccountResponse> => {
    const response = await apiRequest<BackendResponse<MyAccountResponse>>(
      '/credit/my-account'
    );
    return response.data!;
  },

  /**
   * Verificar disponibilidad de crédito
   * POST /api/credit/check-availability
   */
  checkAvailability: async (order_amount: number): Promise<CreditAvailability> => {
    const response = await apiRequest<BackendResponse<CreditAvailability>>(
      '/credit/check-availability',
      {
        method: 'POST',
        body: JSON.stringify({ order_amount }),
      }
    );
    return response.data!;
  },

  /**
   * Pagar mi deuda
   * POST /api/credit/my-payment
   */
  makeMyPayment: async (paymentData: MyCreditPaymentDTO): Promise<CreditPayment> => {
    const response = await apiRequest<BackendResponse<{ payment: CreditPayment }>>(
      '/credit/my-payment',
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );
    return response.data!.payment;
  },

  /**
   * Obtener mi historial crediticio
   * GET /api/credit/my-history?limit=50
   */
  getMyHistory: async (limit?: number): Promise<{ history: CreditHistory[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const response = await apiRequest<BackendResponse<{ history: CreditHistory[] }>>(
      `/credit/my-history?${queryParams}`
    );
    return {
      history: response.data!.history,
      count: response.count || 0,
    };
  },

  /**
   * Obtener mis pedidos fiados pendientes
   * GET /api/credit/my-pending-orders
   */
  getMyPendingOrders: async (): Promise<{ orders: PendingCreditOrder[]; count: number }> => {
    const response = await apiRequest<BackendResponse<{ orders: PendingCreditOrder[] }>>(
      '/credit/my-pending-orders'
    );
    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Obtener mi reporte de gastos fiados
   * GET /api/credit/my-report?period=monthly
   */
  getMyReport: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    start_date?: string;
    end_date?: string;
  }): Promise<CreditReport> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await apiRequest<BackendResponse<CreditReport>>(
      `/credit/my-report?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Descargar mi reporte en PDF
   * GET /api/credit/my-report/pdf?period=monthly
   */
  downloadMyReportPDF: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = `${API_CONFIG.BASE_URL}/credit/my-report/pdf?${queryParams}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al descargar el reporte PDF');
    }

    return await response.blob();
  },

  /**
   * Descargar mi estado de cuenta en PDF
   * GET /api/credit/my-account/pdf
   */
  downloadMyAccountPDF: async (): Promise<Blob> => {
    const url = `${API_CONFIG.BASE_URL}/credit/my-account/pdf`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al descargar el estado de cuenta PDF');
    }

    return await response.blob();
  },

  // ========== ENDPOINTS PARA ADMINISTRADORES ==========

  /**
   * Registrar pago por el cliente (Admin)
   * POST /api/credit/payment
   */
  registerPayment: async (paymentData: AdminCreditPaymentDTO): Promise<CreditPayment> => {
    const response = await apiRequest<BackendResponse<{ payment: CreditPayment }>>(
      '/credit/payment',
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );
    return response.data!.payment;
  },

  /**
   * Obtener historial de pagos de un usuario (Admin)
   * GET /api/credit/payments/:userId?limit=50
   */
  getUserPayments: async (userId: string, limit?: number): Promise<{ payments: CreditPayment[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const response = await apiRequest<BackendResponse<{ payments: CreditPayment[] }>>(
      `/credit/payments/${userId}?${queryParams}`
    );
    return {
      payments: response.data!.payments,
      count: response.count || 0,
    };
  },

  /**
   * Obtener historial crediticio de un usuario (Admin)
   * GET /api/credit/history/:userId?limit=100
   */
  getUserHistory: async (userId: string, limit?: number): Promise<{ history: CreditHistory[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const response = await apiRequest<BackendResponse<{ history: CreditHistory[] }>>(
      `/credit/history/${userId}?${queryParams}`
    );
    return {
      history: response.data!.history,
      count: response.count || 0,
    };
  },

  /**
   * Obtener pedidos pendientes de un usuario (Admin)
   * GET /api/credit/pending-orders/:userId
   */
  getUserPendingOrders: async (userId: string): Promise<{ orders: PendingCreditOrder[]; count: number }> => {
    const response = await apiRequest<BackendResponse<{ orders: PendingCreditOrder[] }>>(
      `/credit/pending-orders/${userId}`
    );
    return {
      orders: response.data!.orders,
      count: response.count || 0,
    };
  },

  /**
   * Obtener todos los usuarios con deuda (Admin)
   * GET /api/credit/users-with-debt
   */
  getUsersWithDebt: async (): Promise<{ users: UserWithDebt[]; count: number }> => {
    const response = await apiRequest<BackendResponse<{ users: UserWithDebt[] }>>(
      '/credit/users-with-debt'
    );
    return {
      users: response.data!.users,
      count: response.count || 0,
    };
  },

  /**
   * Generar reporte de deudas (Admin)
   * GET /api/credit/debt-report?min_debt=50&account_status=active
   */
  getDebtReport: async (params?: {
    min_debt?: number;
    account_status?: 'active' | 'suspended' | 'inactive';
  }): Promise<{ users: DebtReportItem[]; count: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.min_debt) queryParams.append('min_debt', params.min_debt.toString());
    if (params?.account_status) queryParams.append('account_status', params.account_status);

    const response = await apiRequest<BackendResponse<{ users: DebtReportItem[] }>>(
      `/credit/debt-report?${queryParams}`
    );
    return {
      users: response.data!.users,
      count: response.count || 0,
    };
  },

  /**
   * Obtener resumen mensual (Admin)
   * GET /api/credit/monthly-summary?year=2025&month=11
   */
  getMonthlySummary: async (year: number, month: number): Promise<MonthlySummary> => {
    const queryParams = new URLSearchParams();
    queryParams.append('year', year.toString());
    queryParams.append('month', month.toString());

    const response = await apiRequest<BackendResponse<{ summary: MonthlySummary }>>(
      `/credit/monthly-summary?${queryParams}`
    );
    return response.data!.summary;
  },

  /**
   * Obtener reporte de un usuario específico (Admin)
   * GET /api/credit/user-report/:userId?period=monthly
   */
  getUserReport: async (userId: string, params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    start_date?: string;
    end_date?: string;
  }): Promise<CreditReport> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await apiRequest<BackendResponse<CreditReport>>(
      `/credit/user-report/${userId}?${queryParams}`
    );
    return response.data!;
  },

  /**
   * Descargar reporte de usuario en PDF (Admin)
   * GET /api/credit/user-report/:userId/pdf?period=monthly
   */
  downloadUserReportPDF: async (userId: string, params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = `${API_CONFIG.BASE_URL}/credit/user-report/${userId}/pdf?${queryParams}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al descargar el reporte de usuario PDF');
    }

    return await response.blob();
  },

  /**
   * Activar cuenta de crédito (Admin)
   * POST /api/credit/enable/:userId
   */
  enableCredit: async (userId: string, data: EnableCreditDTO): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>(
      `/credit/enable/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!.user;
  },

  /**
   * Desactivar cuenta de crédito (Admin)
   * POST /api/credit/disable/:userId
   */
  disableCredit: async (userId: string): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>(
      `/credit/disable/${userId}`,
      {
        method: 'POST',
      }
    );
    return response.data!.user;
  },

  /**
   * Actualizar límite de crédito (Admin)
   * PATCH /api/credit/update-limit/:userId
   */
  updateCreditLimit: async (userId: string, data: UpdateCreditLimitDTO): Promise<User> => {
    const response = await apiRequest<BackendResponse<{ user: User }>>(
      `/credit/update-limit/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return response.data!.user;
  },

  /**
   * Ajustar deuda manualmente (Admin)
   * POST /api/credit/adjust-debt/:userId
   */
  adjustDebt: async (userId: string, data: AdjustDebtDTO): Promise<{ user: User; history: CreditHistory }> => {
    const response = await apiRequest<BackendResponse<{ user: User; history: CreditHistory }>>(
      `/credit/adjust-debt/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
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
  weeklyMenus: weeklyMenusApi,
  credit: creditApi,
};

export default api;
