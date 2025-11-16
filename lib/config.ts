// Configuración de la API
export const API_CONFIG = {
  // Cambia esta URL por la de tu backend
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',

  // Timeout por defecto (30 segundos)
  TIMEOUT: 30000,

  // Headers por defecto
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Helper para obtener el token del localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Helper para guardar el token en localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

// Helper para eliminar el token del localStorage
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

// Helper para obtener headers con autenticación
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    ...API_CONFIG.HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
