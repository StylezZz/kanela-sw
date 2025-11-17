'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';
import { Order } from '@/lib/types';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (filterStatus !== 'all') {
      filtered = orders.filter((o) => o.status === filterStatus);
    }
    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, filterStatus]);

  const orderStats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'preparing').length,
      completed: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

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

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Orden actualizada a: ${getStatusText(newStatus)}`);
    if (selectedOrder?.order_id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  return (
    <DashboardLayout showCart={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Órdenes</h1>
          <p className="text-muted-foreground">
            Gestiona todas las órdenes del sistema
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {orderStats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {orderStats.processing}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orderStats.completed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {orderStats.cancelled}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de filtro */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="processing">En Proceso</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay órdenes en esta categoría</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.order_id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Pedido #{order.order_id.slice(-8)}
                          </CardTitle>
                          <CardDescription>
                            {order.user?.full_name} •{' '}
                            {new Date(order.created_at).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getStatusVariant(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusText(order.status)}</span>
                          </Badge>
                          <Badge variant="outline">
                            {getPaymentMethodName(order.payment_method)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            {order.items?.length || 0} producto(s)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="secondary">
                                {item.product_name} x{item.quantity}
                              </Badge>
                            ))}
                            {order.items?.length || 0 > 3 && (
                              <Badge variant="secondary">
                                +{order.items?.length || 0 - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(parseFloat(order.total_amount))}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(order.order_id, 'preparing')
                                }
                              >
                                Procesar
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(order.order_id, 'delivered')
                                }
                              >
                                Completar
                              </Button>
                            )}
                            {(order.status === 'pending' ||
                              order.status === 'preparing') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleStatusChange(order.order_id, 'cancelled')
                                }
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de detalles */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido #{selectedOrder.order_id.slice(-8)}</DialogTitle>
              <DialogDescription>
                {new Date(selectedOrder.created_at).toLocaleString('es-PE', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Info del cliente */}
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <p>{selectedOrder.user?.full_name}</p>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Productos</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {formatCurrency(parseFloat(item.unit_price))}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(parseFloat(item.subtotal))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(parseFloat(selectedOrder.total_amount))}
                </span>
              </div>

              {/* Método de pago */}
              <div>
                <h3 className="font-semibold mb-2">Método de Pago</h3>
                <Badge variant="outline">
                  {getPaymentMethodName(selectedOrder.payment_method)}
                </Badge>
              </div>

              {/* Notas */}
              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Notas</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Estado */}
              <div>
                <h3 className="font-semibold mb-2">Estado</h3>
                <div className="flex gap-2">
                  <Badge variant={getStatusVariant(selectedOrder.status)}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1">
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Acciones */}
              {selectedOrder.status !== 'delivered' &&
                selectedOrder.status !== 'cancelled' && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      {selectedOrder.status === 'pending' && (
                        <Button
                          className="flex-1"
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'preparing');
                          }}
                        >
                          Marcar como En Proceso
                        </Button>
                      )}
                      {selectedOrder.status === 'preparing' && (
                        <Button
                          className="flex-1"
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'delivered');
                          }}
                        >
                          Marcar como Completado
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          handleStatusChange(selectedOrder.order_id, 'cancelled');
                        }}
                      >
                        Cancelar Orden
                      </Button>
                    </div>
                  </>
                )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
