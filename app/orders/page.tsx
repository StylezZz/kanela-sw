'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { ShoppingBag, Clock, CheckCircle2, XCircle, Eye, RefreshCw } from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';
import { Order } from '@/lib/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Cargar órdenes desde la API
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando órdenes desde la API...');
      
      // Llamada a la API - endpoint GET /orders
      const response = await api.orders.getAll();
      
      console.log('✅ Órdenes cargadas:', response.orders.length);
      setOrders(response.orders);
    } catch (error) {
      console.error('❌ Error cargando órdenes:', error);
      toast.error('Error al cargar las órdenes');
    } finally {
      setIsLoading(false);
    }
  };

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
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'preparing':
        return <Clock className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle2 className="h-4 w-4" />;
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
      case 'confirmed':
        return 'default';
      case 'preparing':
        return 'default';
      case 'ready':
        return 'outline';
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
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log(`🔄 Actualizando orden ${orderId} a estado: ${newStatus}`);
      
      // Llamada a la API - endpoint PATCH /orders/:id/status
      const updatedOrder = await api.orders.updateStatus(orderId, newStatus);
      
      console.log('✅ Orden actualizada:', updatedOrder);
      
      // Actualizar la lista local
      setOrders(orders.map(order => 
        order.order_id === orderId ? updatedOrder : order
      ));
      
      // Actualizar orden seleccionada si es la misma
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      
      toast.success(`Orden actualizada a: ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('❌ Error actualizando orden:', error);
      toast.error('Error al actualizar el estado de la orden');
    }
  };

  return (
    <DashboardLayout showCart={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Órdenes</h1>
            <p className="text-muted-foreground">
              Gestiona todas las órdenes del sistema
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
              <CardTitle className="text-sm font-medium">Preparando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {orderStats.preparing}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Listos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {orderStats.ready}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orderStats.delivered}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
            <TabsTrigger value="preparing">Preparando</TabsTrigger>
            <TabsTrigger value="ready">Listos</TabsTrigger>
            <TabsTrigger value="delivered">Entregados</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
                <p className="text-muted-foreground">Cargando órdenes...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
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
                            {order.order_number}
                          </CardTitle>
                          <CardDescription>
                            {order.customer_name || order.user?.full_name} •{' '}
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
                            {order.total_items_quantity} producto(s) • {order.items_count} tipo(s)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="secondary">
                                {item.product_name} x{item.quantity}
                              </Badge>
                            ))}
                            {(order.items?.length || 0) > 3 && (
                              <Badge variant="secondary">
                                +{(order.items?.length || 0) - 3} más
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
                                  handleStatusChange(order.order_id, 'confirmed')
                                }
                              >
                                Confirmar
                              </Button>
                            )}
                            {order.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(order.order_id, 'preparing')
                                }
                              >
                                Preparar
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(order.order_id, 'ready')
                                }
                              >
                                Listo
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(order.order_id, 'delivered')
                                }
                              >
                                Entregar
                              </Button>
                            )}
                            {(order.status === 'pending' ||
                              order.status === 'confirmed' ||
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
              <DialogTitle>Detalles del Pedido {selectedOrder.order_number}</DialogTitle>
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
                <p className="font-medium">{selectedOrder.customer_name || selectedOrder.user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                {selectedOrder.customer_phone && (
                  <p className="text-sm text-muted-foreground">📱 {selectedOrder.customer_phone}</p>
                )}
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
                    <div className="flex flex-col gap-2">
                      {selectedOrder.status === 'pending' && (
                        <Button
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'confirmed');
                          }}
                        >
                          Confirmar Pedido
                        </Button>
                      )}
                      {selectedOrder.status === 'confirmed' && (
                        <Button
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'preparing');
                          }}
                        >
                          Comenzar Preparación
                        </Button>
                      )}
                      {selectedOrder.status === 'preparing' && (
                        <Button
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'ready');
                          }}
                        >
                          Marcar como Listo
                        </Button>
                      )}
                      {selectedOrder.status === 'ready' && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'delivered');
                          }}
                        >
                          Marcar como Entregado
                        </Button>
                      )}
                      {(selectedOrder.status === 'pending' ||
                        selectedOrder.status === 'confirmed' ||
                        selectedOrder.status === 'preparing') && (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            handleStatusChange(selectedOrder.order_id, 'cancelled');
                          }}
                        >
                          Cancelar Orden
                        </Button>
                      )}
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
