'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { orders } = useApp();

  const myOrders = useMemo(() => {
    if (!user) return [];
    return orders
      .filter((o) => o.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Pedidos</h1>
          <p className="text-muted-foreground">
            Historial de todos tus pedidos
          </p>
        </div>

        {myOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No tienes pedidos aún</h2>
            <p className="text-muted-foreground">
              Tus pedidos aparecerán aquí una vez que realices una compra
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Pedido #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleString('es-PE', {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </Badge>
                      <Badge variant="outline">
                        {getPaymentMethodName(order.paymentMethod)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x {formatCurrency(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                          {index < order.items.length - 1 && (
                            <Separator className="my-2" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Notas */}
                    {order.notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Notas:
                          </p>
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      </>
                    )}

                    {/* Total */}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold">Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(order.total)}
                      </p>
                    </div>

                    {/* Fecha de completado */}
                    {order.completedAt && (
                      <div className="text-sm text-muted-foreground">
                        Completado el{' '}
                        {new Date(order.completedAt).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
