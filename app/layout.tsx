import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Kanela - Sistema de Cafetería Escolar",
  description: "Sistema integral para la gestión de cafetería escolar con control de inventario, menú semanal, sistema de fiado y múltiples métodos de pago",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>
          <AppProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
