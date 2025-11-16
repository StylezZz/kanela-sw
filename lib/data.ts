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

// Datos iniciales de ejemplo
export const initialUsers: User[] = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@colegio.com',
    role: 'admin',
    type: 'admin',
    balance: 0,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'María García',
    email: 'maria@estudiante.com',
    role: 'student',
    type: 'secundaria',
    grade: '5to',
    section: 'A',
    balance: -15.5,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Pedro López',
    email: 'pedro@estudiante.com',
    role: 'student',
    type: 'primaria',
    grade: '4to',
    section: 'B',
    balance: 0,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Prof. Ana Martínez',
    email: 'ana@profesor.com',
    role: 'teacher',
    type: 'profesor',
    balance: 0,
    createdAt: new Date(),
  },
];

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Almuerzo Ejecutivo',
    description: 'Plato del día con guarnición, ensalada y refresco',
    price: 12.0,
    category: 'almuerzos',
    stock: 50,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Hamburguesa Clásica',
    description: 'Hamburguesa de carne con papas fritas',
    price: 8.5,
    category: 'almuerzos',
    stock: 30,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Jugo Natural',
    description: 'Jugo de frutas natural (varios sabores)',
    price: 3.0,
    category: 'bebidas',
    stock: 100,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Gaseosa Personal',
    description: 'Gaseosa de 500ml',
    price: 2.5,
    category: 'bebidas',
    stock: 80,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Galletas',
    description: 'Paquete de galletas variadas',
    price: 1.5,
    category: 'snacks',
    stock: 120,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    name: 'Chocolate',
    description: 'Barra de chocolate',
    price: 2.0,
    category: 'snacks',
    stock: 90,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    name: 'Gelatina',
    description: 'Gelatina de sabores',
    price: 2.5,
    category: 'postres',
    stock: 40,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    name: 'Arroz con Pollo',
    description: 'Arroz con pollo, ensalada y papa',
    price: 10.0,
    category: 'almuerzos',
    stock: 35,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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

// Funciones de inicialización
export const initializeData = () => {
  if (typeof window === 'undefined') return;

  // Inicializar solo si no hay datos
  if (!storage.get(STORAGE_KEYS.USERS).length) {
    storage.set(STORAGE_KEYS.USERS, initialUsers);
  }
  if (!storage.get(STORAGE_KEYS.PRODUCTS).length) {
    storage.set(STORAGE_KEYS.PRODUCTS, initialProducts);
  }
  if (!storage.get(STORAGE_KEYS.MENU).length) {
    storage.set(STORAGE_KEYS.MENU, initialMenu);
  }
  if (!storage.get(STORAGE_KEYS.ORDERS).length) {
    storage.set(STORAGE_KEYS.ORDERS, []);
  }
  if (!storage.get(STORAGE_KEYS.TRANSACTIONS).length) {
    storage.set(STORAGE_KEYS.TRANSACTIONS, []);
  }
  if (!storage.get(STORAGE_KEYS.RESERVATIONS).length) {
    storage.set(STORAGE_KEYS.RESERVATIONS, []);
  }
};

// Helper para generar IDs únicos
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper para formatear moneda
export const formatCurrency = (amount: number): string => {
  return `S/ ${amount.toFixed(2)}`;
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
    efectivo: 'Efectivo',
    yape: 'Yape',
    plin: 'Plin',
    transferencia: 'Transferencia',
    fiado: 'Fiado',
  };
  return methods[method] || method;
};
