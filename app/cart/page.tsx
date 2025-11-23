/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
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
import { ShoppingCart, Trash2, Plus, Minus, Copy, Upload, Check } from 'lucide-react';
import { formatCurrency, getPaymentMethodName, generateId } from '@/lib/data';
import { PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { addOrder, addTransaction, updateUserBalance } = useApp();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  // Número de teléfono del dueño para Yape/Plin
  const OWNER_PHONE = '987654321';

  const paymentMethods: PaymentMethod[] = [
    'cash',
    'card',
    'credit',
    'yape_plin',
  ];

  const handleIncrement = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrement = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(OWNER_PHONE);
      setCopied(true);
      toast.success('Número copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar el número');
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }
      setPaymentReceipt(file);
      toast.success('Comprobante cargado correctamente');
    }
  };

  const handleCheckout = async () => {
    if (!user) return;

    setIsProcessing(true);

    try {
      // Crear la orden
      addOrder({
        user_id: user.user_id,
        order_number: '', // Se generará automáticamente
        total_amount: cart.total.toString(),
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'credit' ? 'pending' : 'paid',
        is_credit_order: paymentMethod === 'credit',
        credit_paid_amount: '0.00',
        notes,
        updated_at: new Date().toISOString(),
        items: cart.items.map((item) => ({
          order_item_id: '',
          order_id: '',
          product_id: item.product.product_id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          subtotal: (parseFloat(item.product.price) * item.quantity).toString(),
          created_at: new Date().toISOString(),
        })),
      } as any);

      // Si es fiado, actualizar el balance del usuario
      if (paymentMethod === 'credit') {
        const currentBalance = parseFloat(user.current_balance);
        const newBalance = currentBalance - cart.total;
        updateUserBalance(user.user_id, -cart.total);

        // Crear transacción
        addTransaction({
          userId: user.user_id,
          type: 'fiado',
          amount: -cart.total,
          balance: newBalance,
          description: `Compra a crédito - ${cart.items.length} productos`,
          paymentMethod: 'credit',
          createdBy: user.user_id,
        });
      } else {
        // Crear transacción para otros métodos de pago
        addTransaction({
          userId: user.user_id,
          type: 'compra',
          amount: -cart.total,
          balance: parseFloat(user.current_balance),
          description: `Compra - ${cart.items.length} productos`,
          paymentMethod,
          createdBy: user.user_id,
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
              <Card key={item.product.product_id}>
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
                        {formatCurrency(parseFloat(item.product.price))} c/u
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleDecrement(item.product.product_id, item.quantity)
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
                            handleIncrement(item.product.product_id, item.quantity)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xl font-bold">
                        {formatCurrency(parseFloat(item.product.price) * item.quantity)}
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
                      key={item.product.product_id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>
                        {formatCurrency(parseFloat(item.product.price) * item.quantity)}
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
                {user && parseFloat(user.current_balance) < 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">
                      Deuda actual: {formatCurrency(parseFloat(user.current_balance))}
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

            {paymentMethod === 'credit' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  Compra a Crédito
                </p>
                <p className="text-sm text-yellow-800">
                  Tu nuevo balance será:{' '}
                  <span className="font-bold">
                    {formatCurrency(parseFloat(user?.current_balance || '0') - cart.total)}
                  </span>
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Por favor, realiza el pago de{' '}
                  <span className="font-bold">{formatCurrency(cart.total)}</span> y
                  presenta el comprobante en la cafetería
                </p>
              </div>
            )}

            {paymentMethod === 'yape_plin' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 mb-3">
                    Pago mediante Yape o Plin
                  </p>

                  {/* QR Code */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCodeSVG
                        value={OWNER_PHONE}
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-purple-700 mt-2 text-center">
                      Escanea este código QR con Yape o Plin
                    </p>
                  </div>

                  {/* Número de teléfono */}
                  <div className="space-y-2">
                    <Label className="text-sm text-purple-900">Número de teléfono</Label>
                    <div className="flex gap-2">
                      <Input
                        value={OWNER_PHONE}
                        readOnly
                        className="flex-1 bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyPhone}
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-purple-700">
                      Monto a transferir: <span className="font-bold">{formatCurrency(cart.total)}</span>
                    </p>
                  </div>
                </div>

                {/* Subir comprobante */}
                <div className="space-y-2">
                  <Label htmlFor="receipt" className="text-sm font-medium">
                    Comprobante de pago (opcional)
                  </Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('receipt')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {paymentReceipt ? paymentReceipt.name : 'Subir comprobante'}
                      </Button>
                    </div>
                    {paymentReceipt && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          Comprobante cargado
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentReceipt(null)}
                          className="ml-auto"
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Sube una captura de pantalla de tu comprobante de Yape o Plin
                    </p>
                  </div>
                </div>
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
