/* eslint-disable @typescript-eslint/no-explicit-any */
// Tipos de usuario
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

// Categorías
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

// Producto
export interface Product {
  product_id: string;
  category_id: string;
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
  category_name: string;
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

// Reserva de menú
export interface MenuReservation {
  id: string;
  userId: string;
  menuId: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

// Métodos de pago y estados
export type PaymentMethod = 'cash' | 'card' | 'credit' | 'yape_plin';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

// Estado de la orden
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

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
  // Customer info (campos directos del backend)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  // Estadísticas de items
  items_count?: number;
  total_items_quantity?: number;
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

// ==================== MENÚS SEMANALES ====================
export type ReservationStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type WaitlistStatus = 'waiting' | 'notified' | 'converted' | 'expired';
export type DemandStatus = 'unlimited' | 'available' | 'full' | 'full_with_demand';

export interface WeeklyMenuBackend {
  menu_id: string;
  menu_date: string;
  entry_description: string;
  main_course_description: string;
  drink_description: string;
  dessert_description: string;
  description?: string;
  price: string;
  reservation_deadline: string;
  max_reservations?: number;
  current_reservations: number;
  is_active: boolean;
  can_reserve: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWeeklyMenuDTO {
  menu_date: string;
  entry_description: string;
  main_course_description: string;
  drink_description: string;
  dessert_description: string;
  description?: string;
  price: number;
  reservation_deadline?: string;
  max_reservations?: number;
}

export interface UpdateWeeklyMenuDTO {
  entry_description?: string;
  main_course_description?: string;
  drink_description?: string;
  dessert_description?: string;
  description?: string;
  price?: number;
  reservation_deadline?: string;
  max_reservations?: number;
  is_active?: boolean;
}

export interface MenuReservationBackend {
  reservation_id: string;
  menu_id: string;
  user_id: string;
  quantity: number;
  total_amount: string;
  status: ReservationStatus;
  notes?: string;
  cancellation_reason?: string;
  reserved_at: string;
  confirmed_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  // Joins
  menu?: WeeklyMenuBackend;
  user?: User;
}

export interface CreateMenuReservationDTO {
  quantity: number;
  notes?: string;
}

export interface MenuWaitlist {
  waitlist_id: string;
  menu_id: string;
  user_id: string;
  quantity: number;
  notes?: string;
  status: WaitlistStatus;
  created_at: string;
  notified_at?: string;
  // Joins
  menu?: WeeklyMenuBackend;
  user?: User;
}

export interface MenuStats {
  pending_count: number;
  confirmed_count: number;
  delivered_count: number;
  cancelled_count: number;
  total_quantity: number;
  total_revenue: string;
}

export interface MenuDemand {
  menu_id: string;
  menu_date: string;
  max_reservations?: number;
  current_reservations: number;
  spots_available: number;
  waitlist_count: number;
  waitlist_quantity: number;
  total_demand: number;
  unmet_demand: number;
  demand_status: DemandStatus;
}

export interface DemandReport {
  menu_id: string;
  menu_date: string;
  entry_description: string;
  main_course_description: string;
  max_reservations?: number;
  current_reservations: number;
  waitlist_count: number;
  waitlist_quantity: number;
  total_demand: number;
  unmet_demand: number;
  occupancy_percentage: number;
}

export interface ImportMenusResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  createdMenus: WeeklyMenuBackend[];
}
