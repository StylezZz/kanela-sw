'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  WeeklyMenu,
  Order,
  Transaction,
  MenuReservation,
  User,
} from '@/lib/types';
import {
  storage,
  STORAGE_KEYS,
  initializeData,
  generateId,
} from '@/lib/data';

interface AppContextType {
  // Productos
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Menú semanal
  weeklyMenu: WeeklyMenu[];
  addMenuItem: (menuItem: Omit<WeeklyMenu, 'id' | 'reservations'>) => void;
  updateMenuItem: (id: string, menuItem: Partial<WeeklyMenu>) => void;
  deleteMenuItem: (id: string) => void;

  // Reservas de menú
  reservations: MenuReservation[];
  addReservation: (reservation: Omit<MenuReservation, 'id' | 'createdAt'>) => void;
  cancelReservation: (id: string) => void;

  // Órdenes
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;

  // Transacciones
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;

  // Usuarios (para admin)
  users: User[];
  updateUserBalance: (userId: string, amount: number) => void;

  // Refresh data
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reservations, setReservations] = useState<MenuReservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Inicializar datos si es necesario
    initializeData();
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.get<Product>(STORAGE_KEYS.PRODUCTS));
    setWeeklyMenu(storage.get<WeeklyMenu>(STORAGE_KEYS.MENU));
    setOrders(storage.get<Order>(STORAGE_KEYS.ORDERS));
    setTransactions(storage.get<Transaction>(STORAGE_KEYS.TRANSACTIONS));
    setReservations(storage.get<MenuReservation>(STORAGE_KEYS.RESERVATIONS));
    setUsers(storage.get<User>(STORAGE_KEYS.USERS));
  };

  const refreshData = () => {
    loadData();
  };

  // Productos
  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    storage.set(STORAGE_KEYS.PRODUCTS, updated);
  };

  const updateProduct = (id: string, productUpdate: Partial<Product>) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...productUpdate, updatedAt: new Date() } : p
    );
    setProducts(updated);
    storage.set(STORAGE_KEYS.PRODUCTS, updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    storage.set(STORAGE_KEYS.PRODUCTS, updated);
  };

  // Menú semanal
  const addMenuItem = (menuItem: Omit<WeeklyMenu, 'id' | 'reservations'>) => {
    const newMenuItem: WeeklyMenu = {
      ...menuItem,
      id: generateId(),
      reservations: 0,
    };
    const updated = [...weeklyMenu, newMenuItem];
    setWeeklyMenu(updated);
    storage.set(STORAGE_KEYS.MENU, updated);
  };

  const updateMenuItem = (id: string, menuItemUpdate: Partial<WeeklyMenu>) => {
    const updated = weeklyMenu.map((m) =>
      m.id === id ? { ...m, ...menuItemUpdate } : m
    );
    setWeeklyMenu(updated);
    storage.set(STORAGE_KEYS.MENU, updated);
  };

  const deleteMenuItem = (id: string) => {
    const updated = weeklyMenu.filter((m) => m.id !== id);
    setWeeklyMenu(updated);
    storage.set(STORAGE_KEYS.MENU, updated);
  };

  // Reservas
  const addReservation = (reservation: Omit<MenuReservation, 'id' | 'createdAt'>) => {
    const newReservation: MenuReservation = {
      ...reservation,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...reservations, newReservation];
    setReservations(updated);
    storage.set(STORAGE_KEYS.RESERVATIONS, updated);

    // Actualizar contador de reservas en el menú
    const menuItem = weeklyMenu.find((m) => m.id === reservation.menuId);
    if (menuItem) {
      updateMenuItem(menuItem.id, { reservations: menuItem.reservations + 1 });
    }
  };

  const cancelReservation = (id: string) => {
    const reservation = reservations.find((r) => r.id === id);
    if (reservation) {
      const updated = reservations.map((r) =>
        r.id === id ? { ...r, status: 'cancelled' as const } : r
      );
      setReservations(updated);
      storage.set(STORAGE_KEYS.RESERVATIONS, updated);

      // Actualizar contador de reservas en el menú
      const menuItem = weeklyMenu.find((m) => m.id === reservation.menuId);
      if (menuItem && menuItem.reservations > 0) {
        updateMenuItem(menuItem.id, { reservations: menuItem.reservations - 1 });
      }
    }
  };

  // Órdenes
  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...orders, newOrder];
    setOrders(updated);
    storage.set(STORAGE_KEYS.ORDERS, updated);

    // Actualizar stock de productos
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        updateProduct(product.id, { stock: product.stock - item.quantity });
      }
    });
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    const updated = orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status,
            completedAt: status === 'completed' ? new Date() : o.completedAt,
          }
        : o
    );
    setOrders(updated);
    storage.set(STORAGE_KEYS.ORDERS, updated);
  };

  // Transacciones
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date(),
    };
    const updated = [...transactions, newTransaction];
    setTransactions(updated);
    storage.set(STORAGE_KEYS.TRANSACTIONS, updated);
  };

  // Usuarios
  const updateUserBalance = (userId: string, amount: number) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, balance: u.balance + amount } : u
    );
    setUsers(updated);
    storage.set(STORAGE_KEYS.USERS, updated);

    // Actualizar usuario actual si es el mismo
    const currentUser = storage.getSingle<User>(STORAGE_KEYS.CURRENT_USER);
    if (currentUser?.id === userId) {
      const updatedUser = updated.find((u) => u.id === userId);
      if (updatedUser) {
        storage.setSingle(STORAGE_KEYS.CURRENT_USER, updatedUser);
      }
    }
  };

  const value: AppContextType = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    weeklyMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reservations,
    addReservation,
    cancelReservation,
    orders,
    addOrder,
    updateOrderStatus,
    transactions,
    addTransaction,
    users,
    updateUserBalance,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
