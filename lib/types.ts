// Tipos de usuario
export type UserRole = 'admin' | 'student' | 'teacher';

export type UserType = 'primaria' | 'secundaria' | 'profesor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  type: UserType;
  grade?: string; // Para estudiantes
  section?: string; // Para estudiantes
  balance: number; // Balance de cuenta (fiado)
  avatar?: string;
  createdAt: Date;
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
  description: string;
  price: number;
  category: ProductCategory;
  image?: string;
  stock: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Días de la semana
export type WeekDay =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes';

// Menú semanal
export interface WeeklyMenu {
  id: string;
  day: WeekDay;
  mainDish: string;
  side: string;
  drink: string;
  dessert?: string;
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

// Item de orden
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Orden
export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Tipo de transacción
export type TransactionType =
  | 'compra'
  | 'pago'
  | 'fiado'
  | 'ajuste';

// Transacción (para historial de cuenta)
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balance: number; // Balance después de la transacción
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
