// Tipos de usuario
export type UserRole = 'admin' | 'student' | 'teacher';

export type UserType = 'primaria' | 'secundaria' | 'profesor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  suspension_reason?: string;
  suspended_at?: string;
  has_credit_account: boolean;
  credit_limit: string;
  current_balance: string;
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

// Categorías de productos
export type ProductCategory =
  | 'almuerzos'
  | 'bebidas'
  | 'snacks'
  | 'postres'
  | 'utiles'
  | 'otros';

// Producto
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
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
  // Join fields
  category_name?: string;
  category?: Category;
}

export interface CreateProductDTO {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  week: string; // Formato: "2025-W01"
  reservations: number;
  available: boolean;
  image?: string;
}

// Reserva de menú
export interface MenuReservation {
  id: string;
  userId: string;
  menuId: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

// Métodos de pago
export type PaymentMethod =
  | 'efectivo'
  | 'yape'
  | 'plin'
  | 'transferencia'
  | 'fiado';

// Estado de la orden
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'credit';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

export interface Order {
  order_id: string;
  user_id: string;
  order_number: string;
  total_amount: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  is_credit_order: boolean;
  credit_paid_amount: string;
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
  productId: string;
  productName: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
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
  amount: string;
  payment_method: 'cash' | 'card' | 'transfer';
  balance_before: string;
  balance_after: string;
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
  amount: string;
  balance_before: string;
  balance_after: string;
  order_id?: string;
  payment_id?: string;
  description: string;
  orderId?: string;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  createdBy: string; // ID del admin que creó la transacción
}

// Estadísticas para el dashboard del admin
export interface DashboardStats {
  totalSales: number;
  todaySales: number;
  pendingOrders: number;
  totalUsers: number;
  totalDebt: number;
  topProducts: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
  menuReservations: {
    day: WeekDay;
    count: number;
  }[];
}

// Carrito de compras
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// ==================== RESPONSES DE API ====================
// Estructura específica de tu backend
export interface BackendResponse<T = any> {
  success: boolean;
  token?: string; // Solo para login
  count?: number; // Para listados
  data?: T;
  error?: string;
  message?: string;
}

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

// ==================== FRONTEND-ONLY TYPES (localStorage) ====================
export type WeekDay = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export interface WeeklyMenu {
  id: string;
  day: WeekDay;
  mainDish: string;
  side?: string;
  drink?: string;
  dessert?: string;
  price: number;
  week: string;
  reservations: number;
  available: boolean;
}

export interface MenuReservation {
  id: string;
  userId: string;
  menuId: string;
  date: Date;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'compra' | 'pago' | 'fiado' | 'ajuste';
  amount: number;
  balance: number;
  description: string;
  paymentMethod?: string;
  createdBy: string;
  createdAt: Date;
}
