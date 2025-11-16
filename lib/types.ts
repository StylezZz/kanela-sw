// ==================== USUARIOS ====================
export type UserRole = 'admin' | 'customer';
export type AccountStatus = 'active' | 'suspended' | 'inactive';

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  account_status: AccountStatus;
  suspension_reason?: string;
  suspended_at?: string;
  has_credit_account: boolean;
  credit_limit: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  has_credit_account?: boolean;
  credit_limit?: number;
}

export interface UpdateUserDTO {
  full_name?: string;
  phone?: string;
  account_status?: AccountStatus;
  suspension_reason?: string;
  has_credit_account?: boolean;
  credit_limit?: number;
}

// ==================== CATEGORÍAS ====================
export interface Category {
  category_id: string;
  name: string;
  description?: string;
  icon_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  icon_url?: string;
  display_order?: number;
  is_active?: boolean;
}

// ==================== PRODUCTOS ====================
export interface Product {
  product_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  thumbnail_url?: string;
  stock_quantity: number;
  min_stock_level: number;
  is_available: boolean;
  preparation_time: number;
  calories?: number;
  allergens?: string[];
  created_at: string;
  updated_at: string;
  // Joins
  category?: Category;
}

export interface CreateProductDTO {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  thumbnail_url?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  is_available?: boolean;
  preparation_time?: number;
  calories?: number;
  allergens?: string[];
}

export interface UpdateProductDTO {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  thumbnail_url?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  is_available?: boolean;
  preparation_time?: number;
  calories?: number;
  allergens?: string[];
}

// ==================== ÓRDENES ====================
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'credit';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export interface Order {
  order_id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  is_credit_order: boolean;
  credit_paid_amount: number;
  estimated_ready_time?: string;
  confirmed_at?: string;
  ready_at?: string;
  delivered_at?: string;
  notes?: string;
  cancellation_reason?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  // Joins
  user?: User;
  items?: OrderItem[];
}

export interface CreateOrderDTO {
  user_id: string;
  items: CreateOrderItemDTO[];
  payment_method: PaymentMethod;
  notes?: string;
}

// ==================== ITEMS DE ORDEN ====================
export interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations?: string;
  created_at: string;
  // Joins
  product?: Product;
}

export interface CreateOrderItemDTO {
  product_id: string;
  quantity: number;
  customizations?: string;
}

// ==================== PAGOS DE CRÉDITO ====================
export interface CreditPayment {
  payment_id: string;
  user_id: string;
  order_id?: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  balance_before: number;
  balance_after: number;
  transaction_reference?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  // Joins
  user?: User;
  order?: Order;
  recorded_by_user?: User;
}

export interface CreateCreditPaymentDTO {
  user_id: string;
  order_id?: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  transaction_reference?: string;
  notes?: string;
}

// ==================== HISTORIAL DE CRÉDITO ====================
export type CreditTransactionType =
  | 'charge'
  | 'payment'
  | 'adjustment'
  | 'limit_change';

export interface CreditHistory {
  history_id: string;
  user_id: string;
  transaction_type: CreditTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: string;
  payment_id?: string;
  description: string;
  performed_by?: string;
  created_at: string;
  // Joins
  user?: User;
  order?: Order;
  payment?: CreditPayment;
  performed_by_user?: User;
}

// ==================== NOTIFICACIONES ====================
export type NotificationType =
  | 'order_status'
  | 'credit_alert'
  | 'account_alert'
  | 'promotion'
  | 'system';

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at?: string;
  order_id?: string;
  created_at: string;
  // Joins
  user?: User;
  order?: Order;
}

// ==================== MOVIMIENTOS DE INVENTARIO ====================
export type InventoryMovementType =
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'waste'
  | 'return';

export interface InventoryMovement {
  movement_id: string;
  product_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  order_id?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
  // Joins
  product?: Product;
  order?: Order;
  performed_by_user?: User;
}

// ==================== CONFIGURACIONES ====================
export interface Setting {
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at: string;
  updated_by?: string;
  // Joins
  updated_by_user?: User;
}

// ==================== CARRITO (Frontend only) ====================
export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// ==================== RESPONSES DE API ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== LOGIN ====================
export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// ==================== ESTADÍSTICAS ====================
export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  pendingOrders: number;
  totalCustomers: number;
  totalCreditDebt: number;
  lowStockProducts: number;
  topProducts: {
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
}
