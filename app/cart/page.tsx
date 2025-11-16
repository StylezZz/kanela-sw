'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency, getPaymentMethodName, generateId } from '@/lib/data';
import { PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { addOrder, addTransaction, updateUserBalance } = useApp();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    'efectivo',
    'yape',
    'plin',
    'transferencia',
    'fiado',
  ];

  const handleIncrement = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleCheckout = async () => {
    if (!user) return;

    setIsProcessing(true);

    try {
      // Crear la orden
      addOrder({
        userId: user.id,
        userName: user.name,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity,
        })),
        total: cart.total,
        paymentMethod,
        status: 'pending',
        notes,
      });

      // Si es fiado, actualizar el balance del usuario
      if (paymentMethod === 'fiado') {
        const newBalance = user.balance - cart.total;
        updateUserBalance(user.id, -cart.total);

        // Crear transacción
        addTransaction({
          userId: user.id,
          type: 'fiado',
          amount: -cart.total,
          balance: newBalance,
          description: `Compra a crédito - ${cart.items.length} productos`,
          paymentMethod: 'fiado',
          createdBy: user.id,
        });
      } else {
        // Crear transacción para otros métodos de pago
        addTransaction({
          userId: user.id,
          type: 'compra',
          amount: -cart.total,
          balance: user.balance,
          description: `Compra - ${cart.items.length} productos`,
          paymentMethod,
          createdBy: user.id,
        });
      }

      // Limpiar carrito
      clearCart();

      toast.success('Pedido realizado con éxito');
      setIsCheckoutOpen(false);
      router.push('/my-orders');
    } catch (error) {
      toast.error('Error al procesar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">
            Agrega productos para comenzar tu pedido
          </p>
          <Button onClick={() => router.push('/products')}>
            Explorar productos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showCart={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Carrito de Compras</h1>
          <p className="text-muted-foreground">
            Revisa tus productos antes de realizar el pedido
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.product.description}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatCurrency(item.product.price)} c/u
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleDecrement(item.product.id, item.quantity)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleIncrement(item.product.id, item.quantity)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xl font-bold">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(cart.total)}
                  </span>
                </div>
                {user && user.balance < 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">
                      Deuda actual: {formatCurrency(user.balance)}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Proceder al Pago
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/products')}
                >
                  Seguir Comprando
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Completar Pedido</DialogTitle>
            <DialogDescription>
              Selecciona el método de pago y confirma tu pedido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {getPaymentMethodName(method)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'fiado' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  Compra a Crédito
                </p>
                <p className="text-sm text-yellow-800">
                  Tu nuevo balance será:{' '}
                  <span className="font-bold">
                    {formatCurrency((user?.balance || 0) - cart.total)}
                  </span>
                </p>
              </div>
            )}

            {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Por favor, realiza el pago de{' '}
                  <span className="font-bold">{formatCurrency(cart.total)}</span> y
                  presenta el comprobante en la cafetería
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones especiales..."
                rows={3}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total a pagar:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(cart.total)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={isProcessing}>
              {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
