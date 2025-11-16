'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { storage, STORAGE_KEYS, initialUsers } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario actual del localStorage
    const currentUser = storage.getSingle<User>(STORAGE_KEYS.CURRENT_USER);
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Obtener usuarios del localStorage
      const users = storage.get<User>(STORAGE_KEYS.USERS);

      // Para este demo, cualquier password funciona
      // En producción, aquí validarías contra un backend
      const foundUser = users.find((u) => u.email === email);

      if (foundUser) {
        setUser(foundUser);
        storage.setSingle(STORAGE_KEYS.CURRENT_USER, foundUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    storage.clear(STORAGE_KEYS.CURRENT_USER);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  if (isLoading) {
    return null; // O un loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
