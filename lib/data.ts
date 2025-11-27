import {
  User,
  Product,
  WeeklyMenu,
  Order,
  Transaction,
  MenuReservation,
} from './types';

// Funciones para localStorage
export const STORAGE_KEYS = {
  USERS: 'kanela_users',
  PRODUCTS: 'kanela_products',
  MENU: 'kanela_menu',
  ORDERS: 'kanela_orders',
  TRANSACTIONS: 'kanela_transactions',
  RESERVATIONS: 'kanela_reservations',
  CURRENT_USER: 'kanela_current_user',
};

// Helpers para localStorage
export const storage = {
  get: <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  set: <T>(key: string, value: T[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  getSingle: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  setSingle: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  clear: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// NOTA: Los datos demo han sido eliminados.
// El sistema ahora se conecta directamente al backend PostgreSQL.
// Los usuarios deben ser creados a través de la API del backend.

// NOTA: Los productos demo han sido eliminados.
// Los productos ahora se obtienen directamente del backend PostgreSQL.

export const initialMenu: WeeklyMenu[] = [
  {
    id: '1',
    day: 'lunes',
    mainDish: 'Lomo Saltado',
    side: 'Arroz blanco y papas fritas',
    drink: 'Chicha morada',
    dessert: 'Mazamorra morada',
    price: 12.0,
    week: '2025-W47',
    reservations: 15,
    available: true,
  },
  {
    id: '2',
    day: 'martes',
    mainDish: 'Ají de Gallina',
    side: 'Arroz blanco y papa sancochada',
    drink: 'Refresco de maracuyá',
    dessert: 'Arroz con leche',
    price: 12.0,
    week: '2025-W47',
    reservations: 20,
    available: true,
  },
  {
    id: '3',
    day: 'miercoles',
    mainDish: 'Pollo a la Plancha',
    side: 'Ensalada y arroz integral',
    drink: 'Limonada',
    dessert: 'Fruta de temporada',
    price: 11.0,
    week: '2025-W47',
    reservations: 18,
    available: true,
  },
  {
    id: '4',
    day: 'jueves',
    mainDish: 'Tallarines Rojos',
    side: 'Pollo al horno',
    drink: 'Chicha morada',
    dessert: 'Gelatina',
    price: 10.0,
    week: '2025-W47',
    reservations: 12,
    available: true,
  },
  {
    id: '5',
    day: 'viernes',
    mainDish: 'Pescado Frito',
    side: 'Arroz y yuca frita',
    drink: 'Refresco de piña',
    dessert: 'Suspiro limeño',
    price: 13.0,
    week: '2025-W47',
    reservations: 22,
    available: true,
  },
];

// NOTA: La función de inicialización de datos demo ha sido eliminada.
// El sistema ahora se conecta directamente al backend PostgreSQL.
// No se necesita inicializar datos locales.

// Helper para generar IDs únicos
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper para formatear moneda
export const formatCurrency = (amount: number): string => {
  return `S/ ${amount}`;
};

// Helper para obtener el nombre de categoría
export const getCategoryName = (category: string): string => {
  const categories: Record<string, string> = {
    almuerzos: 'Almuerzos',
    bebidas: 'Bebidas',
    snacks: 'Snacks',
    postres: 'Postres',
    utiles: 'Útiles',
    otros: 'Otros',
  };
  return categories[category] || category;
};

// Helper para obtener el nombre del día
export const getDayName = (day: string): string => {
  const days: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
  };
  return days[day] || day;
};

// Helper para obtener el nombre del método de pago
export const getPaymentMethodName = (method: string): string => {
  const methods: Record<string, string> = {
    // Backend values
    cash: 'Efectivo',
    card: 'Tarjeta',
    credit: 'Fiado',
    transfer: 'Transferencia',
    yape_plin: 'Yape/Plin',
    // Legacy values (por compatibilidad)
    efectivo: 'Efectivo',
    yape: 'Yape',
    plin: 'Plin',
    transferencia: 'Transferencia',
    fiado: 'Fiado',
  };
  return methods[method] || method;
};
