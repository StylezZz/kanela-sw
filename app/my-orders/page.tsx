'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';
import { Order } from '@/lib/types';
import { toast } from 'sonner';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar órdenes desde la API
  useEffect(() => {
    if (user) {
      loadMyOrders();
    }
  }, [user]);

  const loadMyOrders = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando mis órdenes desde la API...');

      // Llamada a la API - endpoint GET /orders/my-orders
      const response = await api.orders.getMyOrders({ include_items: true });

      console.log('✅ Mis órdenes cargadas:', response.orders.length);
      setMyOrders(response.orders);
    } catch (error) {
      console.error('❌ Error cargando mis órdenes:', error);
      toast.error('Error al cargar tus órdenes');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'preparing':
        return <Clock className="h-4 w-4" />;
      case 'delivered':
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
      case 'preparing':
        return 'default';
      case 'delivered':
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
      case 'preparing':
        return 'En Proceso';
      case 'delivered':
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Pedidos</h1>
            <p className="text-muted-foreground">
              Historial de todos tus pedidos
            </p>
          </div>
          <button
            onClick={loadMyOrders}
            disabled={isLoading}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-16 w-16 text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Cargando tus pedidos...</p>
          </div>
        ) : myOrders.length === 0 ? (
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
              <Card key={order.order_id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        {order.order_number}
                      </CardTitle>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleString('es-PE', {
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
                        {getPaymentMethodName(order.payment_method)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x {formatCurrency(parseFloat(item.unit_price))}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatCurrency(parseFloat(item.subtotal))}
                            </p>
                          </div>
                          {order.items && index < order.items.length - 1 && (
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
                        {formatCurrency(parseFloat(order.total_amount))}
                      </p>
                    </div>

                    {/* Fecha de completado */}
                    {order.delivered_at && (
                      <div className="text-sm text-muted-foreground">
                        Completado el{' '}
                        {new Date(order.delivered_at).toLocaleString('es-PE', {
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
