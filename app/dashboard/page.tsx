'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatCurrency, getDayName } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { orders, products, weeklyMenu, users } = useApp();
  const router = useRouter();

  // Estadísticas para admin
  const adminStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );

    const totalSales = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);

    const todaySales = todayOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = orders.filter((o) => o.status === 'pending').length;

    const totalDebt = users.reduce(
      (sum, u) => sum + (u.balance < 0 ? Math.abs(u.balance) : 0),
      0
    );

    return {
      totalSales,
      todaySales,
      pendingOrders,
      totalUsers: users.length,
      totalDebt,
    };
  }, [orders, users]);

  // Pedidos recientes para admin
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  // Menú de hoy para cliente
  const todayMenu = useMemo(() => {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const today = days[new Date().getDay()] as any;
    return weeklyMenu.find((m) => m.day === today);
  }, [weeklyMenu]);

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido de vuelta, {user?.name}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Ventas Totales"
              value={formatCurrency(adminStats.totalSales)}
              icon={DollarSign}
              description="Total acumulado"
            />
            <StatsCard
              title="Ventas Hoy"
              value={formatCurrency(adminStats.todaySales)}
              icon={TrendingUp}
              description="Ventas del día"
            />
            <StatsCard
              title="Órdenes Pendientes"
              value={adminStats.pendingOrders}
              icon={ShoppingBag}
              description="Requieren atención"
            />
            <StatsCard
              title="Total Fiado"
              value={formatCurrency(adminStats.totalDebt)}
              icon={Users}
              description="Deuda acumulada"
            />
          </div>

          {/* Contenido principal */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Órdenes recientes */}
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay órdenes recientes
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{order.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} items •{' '}
                            {new Date(order.createdAt).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatCurrency(order.total)}
                          </p>
                          <Badge
                            variant={
                              order.status === 'completed'
                                ? 'default'
                                : order.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {order.status === 'pending' && 'Pendiente'}
                            {order.status === 'processing' && 'En proceso'}
                            {order.status === 'completed' && 'Completado'}
                            {order.status === 'cancelled' && 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push('/orders')}
                >
                  Ver todas las órdenes
                </Button>
              </CardContent>
            </Card>

            {/* Productos con stock bajo */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Bajo</CardTitle>
              </CardHeader>
              <CardContent>
                {products.filter((p) => p.stock < 10).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todos los productos tienen stock adecuado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {products
                      .filter((p) => p.stock < 10)
                      .slice(0, 5)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          <Badge
                            variant={product.stock < 5 ? 'destructive' : 'secondary'}
                          >
                            {product.stock} en stock
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push('/products')}
                >
                  Ver todos los productos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Dashboard para clientes
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, {user?.name}</h1>
          <p className="text-muted-foreground">
            {user?.role === 'teacher'
              ? 'Profesor'
              : `Estudiante de ${user?.type} - ${user?.grade}${user?.section}`}
          </p>
        </div>

        {/* Balance del usuario */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Mi Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {formatCurrency(user?.balance || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(user?.balance || 0) < 0
                    ? 'Deuda pendiente'
                    : 'Saldo disponible'}
                </p>
              </div>
              <Button onClick={() => router.push('/account')}>
                Ver detalles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/products')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explora nuestro catálogo completo
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/menu')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Menú Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reserva tu almuerzo de la semana
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/my-orders')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Mis Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revisa tu historial de compras
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Menú de hoy */}
        {todayMenu && (
          <Card>
            <CardHeader>
              <CardTitle>Menú de Hoy - {getDayName(todayMenu.day)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Plato Principal
                  </p>
                  <p className="text-lg font-semibold">{todayMenu.mainDish}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Acompañamiento
                  </p>
                  <p>{todayMenu.side}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Bebida
                  </p>
                  <p>{todayMenu.drink}</p>
                </div>
                {todayMenu.dessert && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Postre
                    </p>
                    <p>{todayMenu.dessert}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <p className="text-xl font-bold">
                    {formatCurrency(todayMenu.price)}
                  </p>
                  <Button onClick={() => router.push('/menu')}>
                    Reservar ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
