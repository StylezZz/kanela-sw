/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
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
      console.log('🛒 Creando orden mediante API del backend...');

      // Crear la orden usando la API del backend
      const newOrder = await api.orders.create({
        payment_method: paymentMethod,
        notes: notes || undefined,
        items: cart.items.map((item) => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
          customizations: undefined, // Puedes agregar customizaciones si es necesario
        })),
      });

      console.log('✅ Orden creada exitosamente:', newOrder);

      // Limpiar carrito
      clearCart();

      // Mostrar código QR si existe
      if (newOrder.qr_code) {
        console.log('📱 Código QR generado para la orden');
      }

      toast.success(`Pedido ${newOrder.order_number} creado con éxito`);
      setIsCheckoutOpen(false);
      setPaymentReceipt(null);
      setNotes('');
      router.push('/my-orders');
    } catch (error) {
      console.error('❌ Error al procesar el pedido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar el pedido';
      toast.error(errorMessage);
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
      {/* Dialog de checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Completar Pedido</DialogTitle>
            <DialogDescription>
              Selecciona el método de pago y confirma tu pedido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-1">
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
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Por favor, realiza el pago de{' '}
                  <span className="font-bold">{formatCurrency(cart.total)}</span> y
                  presenta el comprobante en la cafetería
                </p>
              </div>
            )}

            {paymentMethod === 'yape_plin' && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-purple-900 text-center">
                    Pago mediante Yape o Plin
                  </p>

                  {/* QR Code más compacto */}
                  <div className="flex justify-center">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-purple-100">
                      <QRCodeSVG
                        value={OWNER_PHONE}
                        size={140}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-purple-700 text-center">
                    Escanea este código QR con tu app
                  </p>

                  {/* Número de teléfono compacto */}
                  <div className="space-y-1">
                    <Label className="text-xs text-purple-900">Número de teléfono</Label>
                    <div className="flex gap-2">
                      <Input
                        value={OWNER_PHONE}
                        readOnly
                        className="flex-1 bg-white font-mono text-center text-sm h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyPhone}
                        className="shrink-0 h-9 w-9"
                        title="Copiar número"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Monto más compacto */}
                  <div className="bg-purple-100 p-2.5 rounded-md border border-purple-300">
                    <p className="text-xs text-purple-900 text-center">
                      Monto a transferir:{' '}
                      <span className="font-bold text-base text-purple-950">
                        {formatCurrency(cart.total)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Comprobante compacto */}
                <div className="space-y-1.5">
                  <Label htmlFor="receipt" className="text-xs font-medium">
                    Comprobante de pago (opcional)
                  </Label>
                  <div className="flex flex-col gap-2">
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
                      size="sm"
                      className="w-full justify-start h-9"
                      onClick={() => document.getElementById('receipt')?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      {paymentReceipt ? (
                        <span className="truncate text-xs">{paymentReceipt.name}</span>
                      ) : (
                        'Subir captura de pantalla'
                      )}
                    </Button>
                    {paymentReceipt && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          <span className="text-xs text-green-700 truncate">
                            {paymentReceipt.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentReceipt(null)}
                          className="shrink-0 h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones especiales..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Total a pagar:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(cart.total)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
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
