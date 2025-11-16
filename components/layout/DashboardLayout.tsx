'use client';

import { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showCart?: boolean;
}

export function DashboardLayout({
  children,
  showCart = true,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          showCart={showCart}
        />
        <main className="container py-6 px-4">{children}</main>
      </div>
    </div>
  );
}
