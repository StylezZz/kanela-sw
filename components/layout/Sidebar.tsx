'use client';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Package,
  Calendar,
  ShoppingBag,
  Users,
  Receipt,
  BarChart3,
  UtensilsCrossed,
  Wallet,
  History,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const adminNavItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Productos',
      href: '/products',
      icon: Package,
    },
    {
      title: 'Menú Semanal',
      href: '/menu',
      icon: Calendar,
    },
    {
      title: 'Órdenes',
      href: '/orders',
      icon: ShoppingBag,
    },
    {
      title: 'Usuarios',
      href: '/users',
      icon: Users,
    },
    {
      title: 'Transacciones',
      href: '/transactions',
      icon: Receipt,
    },
    {
      title: 'Reportes',
      href: '/reports',
      icon: BarChart3,
    },
  ];

  const clientNavItems = [
    {
      title: 'Inicio',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Productos',
      href: '/products',
      icon: UtensilsCrossed,
    },
    {
      title: 'Menú Semanal',
      href: '/menu',
      icon: Calendar,
    },
    {
      title: 'Mis Pedidos',
      href: '/my-orders',
      icon: ShoppingBag,
    },
    {
      title: 'Mi Cuenta',
      href: '/account',
      icon: Wallet,
    },
    {
      title: 'Historial',
      href: '/history',
      icon: History,
    },
  ];

  const navItems = isAdmin ? adminNavItems : clientNavItems;

  const handleNavigation = (href: string) => {
    router.push(href);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay para móvil */}
      {open && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">K</span>
            </div>
            <span className="text-xl font-bold">Kanela</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Button
                  key={item.href}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
