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
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency, getDayName } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardStatistics } from '@/lib/types';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { orders, products, weeklyMenu, users } = useApp();
  const router = useRouter();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  // Datos mock para fallback
  const mockStatistics: DashboardStatistics = {
    summary: {
      total_orders: 150,
      delivered_orders: 120,
      cancelled_orders: 10,
      active_orders: 20,
      total_revenue: 15000,
      avg_order_value: 100,
      unique_customers: 50,
      total_items_sold: 450,
      orders_by_payment: [
        { payment_method: 'cash', count: 60, total_amount: 6000 },
        { payment_method: 'card', count: 40, total_amount: 4500 },
        { payment_method: 'credit', count: 30, total_amount: 3000 },
        { payment_method: 'yape', count: 20, total_amount: 1500 },
      ],
    },
    top_products: [
      { product_id: '1', product_name: 'Café Americano', category_name: 'Bebidas', total_quantity: 80, times_ordered: 60, total_revenue: 1200, avg_price: 15 },
      { product_id: '2', product_name: 'Sandwich de Pollo', category_name: 'Comida', total_quantity: 50, times_ordered: 50, total_revenue: 1500, avg_price: 30 },
      { product_id: '3', product_name: 'Galletas', category_name: 'Snacks', total_quantity: 100, times_ordered: 80, total_revenue: 800, avg_price: 8 },
    ],
    top_categories: [
      { category_id: '1', category_name: 'Bebidas', times_ordered: 100, items_sold: 200, total_revenue: 3000, product_count: 10 },
      { category_id: '2', category_name: 'Comida', times_ordered: 80, items_sold: 150, total_revenue: 4500, product_count: 15 },
      { category_id: '3', category_name: 'Snacks', times_ordered: 120, items_sold: 180, total_revenue: 1800, product_count: 20 },
    ],
    sales_last_7_days: [
      { date: '2025-11-21', day_name: 'Lunes', total_orders: 20, total_revenue: 2000, avg_order_value: 100, cash_revenue: 800, card_revenue: 600, credit_revenue: 400, yape_revenue: 200 },
      { date: '2025-11-22', day_name: 'Martes', total_orders: 25, total_revenue: 2500, avg_order_value: 100, cash_revenue: 1000, card_revenue: 750, credit_revenue: 500, yape_revenue: 250 },
      { date: '2025-11-23', day_name: 'Miércoles', total_orders: 22, total_revenue: 2200, avg_order_value: 100, cash_revenue: 880, card_revenue: 660, credit_revenue: 440, yape_revenue: 220 },
      { date: '2025-11-24', day_name: 'Jueves', total_orders: 28, total_revenue: 2800, avg_order_value: 100, cash_revenue: 1120, card_revenue: 840, credit_revenue: 560, yape_revenue: 280 },
      { date: '2025-11-25', day_name: 'Viernes', total_orders: 30, total_revenue: 3000, avg_order_value: 100, cash_revenue: 1200, card_revenue: 900, credit_revenue: 600, yape_revenue: 300 },
      { date: '2025-11-26', day_name: 'Sábado', total_orders: 15, total_revenue: 1500, avg_order_value: 100, cash_revenue: 600, card_revenue: 450, credit_revenue: 300, yape_revenue: 150 },
      { date: '2025-11-27', day_name: 'Domingo', total_orders: 10, total_revenue: 1000, avg_order_value: 100, cash_revenue: 400, card_revenue: 300, credit_revenue: 200, yape_revenue: 100 },
    ],
    sales_by_hour: [
      { hour: 8, total_orders: 10, total_revenue: 500, avg_order_value: 50 },
      { hour: 9, total_orders: 15, total_revenue: 900, avg_order_value: 60 },
      { hour: 10, total_orders: 20, total_revenue: 1200, avg_order_value: 60 },
      { hour: 11, total_orders: 25, total_revenue: 1875, avg_order_value: 75 },
      { hour: 12, total_orders: 35, total_revenue: 3500, avg_order_value: 100 },
      { hour: 13, total_orders: 30, total_revenue: 3000, avg_order_value: 100 },
      { hour: 14, total_orders: 20, total_revenue: 1600, avg_order_value: 80 },
      { hour: 15, total_orders: 15, total_revenue: 1050, avg_order_value: 70 },
    ],
    payment_methods: [
      { payment_method: 'cash', total_orders: 60, total_revenue: 6000, avg_order_value: 100, percentage: 40 },
      { payment_method: 'card', total_orders: 40, total_revenue: 4500, avg_order_value: 112.5, percentage: 26.7 },
      { payment_method: 'credit', total_orders: 30, total_revenue: 3000, avg_order_value: 100, percentage: 20 },
      { payment_method: 'yape', total_orders: 20, total_revenue: 1500, avg_order_value: 75, percentage: 13.3 },
    ],
    top_customers: [
      { user_id: '1', full_name: 'Juan Pérez', email: 'juan@example.com', total_orders: 15, total_spent: 1500, avg_order_value: 100, last_order_date: '2025-11-27', has_credit_account: true, current_balance: -200 },
      { user_id: '2', full_name: 'María García', email: 'maria@example.com', total_orders: 12, total_spent: 1200, avg_order_value: 100, last_order_date: '2025-11-26', has_credit_account: false, current_balance: 0 },
      { user_id: '3', full_name: 'Carlos López', email: 'carlos@example.com', total_orders: 10, total_spent: 1000, avg_order_value: 100, last_order_date: '2025-11-25', has_credit_account: true, current_balance: -150 },
    ],
    delivery_stats: {
      avg_delivery_time: 25,
      min_delivery_time: 10,
      max_delivery_time: 45,
      median_delivery_time: 23,
      total_delivered_orders: 120,
    },
  };

  useEffect(() => {
    if (isAdmin) {
      loadStatistics();
    }
  }, [isAdmin]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await api.statistics.getDashboard();
      setStatistics(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      // Usar datos mock en caso de error
      setStatistics(mockStatistics);
    } finally {
      setLoading(false);
    }
  };

  // Calcular tendencias
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  };

  // Menú de hoy para cliente
  const todayMenu = useMemo(() => {
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const today = days[new Date().getDay()] as any;
    return weeklyMenu.find((m) => m.day === today);
  }, [weeklyMenu]);

  if (isAdmin) {
    if (loading || !statistics) {
      return (
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </DashboardLayout>
      );
    }

    const { summary, top_products, top_categories, sales_last_7_days, sales_by_hour, payment_methods, top_customers } = statistics;

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bienvenido de vuelta, {user?.full_name}
            </p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Ingresos Totales"
              value={formatCurrency(summary.total_revenue)}
              icon={DollarSign}
              description={`${summary.delivered_orders} órdenes entregadas`}
            />
            <StatsCard
              title="Órdenes Totales"
              value={summary.total_orders}
              icon={ShoppingBag}
              description={`${summary.active_orders} activas`}
            />
            <StatsCard
              title="Clientes Únicos"
              value={summary.unique_customers}
              icon={Users}
              description="Total de clientes"
            />
            <StatsCard
              title="Promedio por Orden"
              value={formatCurrency(summary.avg_order_value)}
              icon={TrendingUp}
              description={`${summary.total_items_sold} items vendidos`}
            />
          </div>

          {/* Ventas de los últimos 7 días */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas de los Últimos 7 Días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sales_last_7_days.map((sale, index) => {
                  const maxRevenue = Math.max(...sales_last_7_days.map(s => s.total_revenue));
                  const percentage = (sale.total_revenue / maxRevenue) * 100;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{sale.day_name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(sale.total_revenue)} • {sale.total_orders} órdenes
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Productos y Categorías */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {top_products.slice(0, 5).map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.product_name}</p>
                          <p className="text-xs text-muted-foreground">{product.category_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(product.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">{product.total_quantity} vendidos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Categorías */}
            <Card>
              <CardHeader>
                <CardTitle>Categorías Más Vendidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {top_categories.slice(0, 5).map((category, index) => (
                    <div key={category.category_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{category.category_name}</p>
                          <p className="text-xs text-muted-foreground">{category.product_count} productos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(category.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">{category.items_sold} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métodos de Pago y Top Clientes */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Métodos de Pago */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payment_methods.map((method) => {
                    const methodNames: Record<string, string> = {
                      cash: 'Efectivo',
                      card: 'Tarjeta',
                      credit: 'Fiado',
                      yape: 'Yape',
                    };

                    return (
                      <div key={method.payment_method} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{methodNames[method.payment_method] || method.payment_method}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(method.total_revenue)} ({method.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${method.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Mejores Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {top_customers.slice(0, 5).map((customer, index) => (
                    <div key={customer.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{customer.full_name}</p>
                          <p className="text-xs text-muted-foreground">{customer.total_orders} pedidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(customer.total_spent)}</p>
                        {customer.has_credit_account && customer.current_balance < 0 && (
                          <p className="text-xs text-destructive">
                            Debe: {formatCurrency(Math.abs(customer.current_balance))}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ventas por Hora */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Hora del Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sales_by_hour.map((hourSale) => {
                  const maxRevenue = Math.max(...sales_by_hour.map(s => s.total_revenue));
                  const percentage = (hourSale.total_revenue / maxRevenue) * 100;

                  return (
                    <div key={hourSale.hour} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{hourSale.hour}:00</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(hourSale.total_revenue)} • {hourSale.total_orders} órdenes
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Dashboard para clientes
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, {user?.full_name}</h1>
          <p className="text-muted-foreground">
            Cliente de la cafetería
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
                  {formatCurrency(parseFloat(user?.current_balance || '0'))}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseFloat(user?.current_balance || '0') < 0
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
