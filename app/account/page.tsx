'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Plus,
  ArrowUpDown,
  Download,
  CreditCard,
  Receipt,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type {
  MyAccountResponse,
  CreditHistory,
  PendingCreditOrder
} from '@/lib/types';

export default function AccountPage() {
  const { user } = useAuth();

  // Estados para datos de la API
  const [accountData, setAccountData] = useState<MyAccountResponse | null>(null);
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados del formulario de pago
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'yape' | 'plin' | 'transfer'>('yape');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  // Métodos de pago disponibles
  const paymentMethods: Array<'cash' | 'card' | 'yape' | 'plin' | 'transfer'> = [
    'yape',
    'plin',
    'cash',
    'card',
    'transfer',
  ];

  // Cargar datos de la cuenta
  const loadAccountData = async () => {
    try {
      setIsLoading(true);
      const [account, history] = await Promise.all([
        api.credit.getMyAccount(),
        api.credit.getMyHistory(100),
      ]);

      setAccountData(account);
      setCreditHistory(history.history);
    } catch (error) {
      console.error('Error al cargar datos de cuenta:', error);
      toast.error('Error al cargar los datos de tu cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAccountData();
    }
  }, [user]);

  // Manejar pago
  const handlePayment = async () => {
    if (!user) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    if (!accountData) {
      toast.error('No se pudo cargar la información de tu cuenta');
      return;
    }

    // Validar que el pago no exceda la deuda
    if (amount > accountData.account.current_balance) {
      toast.error('El monto del pago no puede exceder tu deuda actual');
      return;
    }

    try {
      setIsProcessing(true);

      await api.credit.makeMyPayment({
        amount,
        payment_method: paymentMethod,
        transaction_reference: transactionReference || undefined,
        notes: notes || undefined,
      });

      toast.success('Pago registrado correctamente');
      setIsPaymentOpen(false);
      setPaymentAmount('');
      setTransactionReference('');
      setNotes('');

      // Recargar datos
      await loadAccountData();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  // Descargar PDF del estado de cuenta
  const handleDownloadAccountPDF = async () => {
    try {
      toast.info('Descargando estado de cuenta...');
      const blob = await api.credit.downloadMyAccountPDF();

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estado-cuenta-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Estado de cuenta descargado');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      toast.error('Error al descargar el estado de cuenta');
    }
  };

  // Estadísticas calculadas
  const stats = useMemo(() => {
    if (!creditHistory.length) {
      return {
        totalCharged: 0,
        totalPaid: 0,
        transactionCount: 0,
      };
    }

    const totalCharged = creditHistory
      .filter((h) => h.transaction_type === 'charge')
      .reduce((sum, h) => sum + parseFloat(h.amount), 0);

    const totalPaid = creditHistory
      .filter((h) => h.transaction_type === 'payment')
      .reduce((sum, h) => sum + parseFloat(h.amount), 0);

    return {
      totalCharged,
      totalPaid,
      transactionCount: creditHistory.length,
    };
  }, [creditHistory]);

  // Helper para obtener el tipo de transacción en español
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'charge':
        return 'Cargo';
      case 'payment':
        return 'Pago';
      case 'adjustment':
        return 'Ajuste';
      case 'limit_change':
        return 'Cambio de límite';
      default:
        return type;
    }
  };

  // Helper para obtener el badge variant según el tipo
  const getTransactionBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'charge':
        return 'destructive';
      case 'payment':
        return 'default';
      case 'adjustment':
        return 'secondary';
      case 'limit_change':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando información de tu cuenta...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!accountData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se pudo cargar la información de tu cuenta</p>
            <Button onClick={loadAccountData} className="mt-4">
              Reintentar
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { account, pending_orders } = accountData;
  const hasDebt = account.current_balance > 0;
  const usagePercent = parseFloat(account.usage_percent);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mi Cuenta de Crédito</h1>
            <p className="text-muted-foreground">
              Gestiona tu crédito y revisa tu historial
            </p>
          </div>
          <Button variant="outline" onClick={handleDownloadAccountPDF}>
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>

        {/* Estado de Cuenta Card */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Balance y Límite */}
          <Card className={hasDebt
            ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900 dark:border-red-800"
            : "bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800"
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Deuda Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold">
                    {formatCurrency(account.current_balance)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    de {formatCurrency(account.credit_limit)} límite de crédito
                  </p>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uso del crédito</span>
                    <span className="font-medium">{account.usage_percent}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        usagePercent >= 90 ? 'bg-red-600' :
                        usagePercent >= 70 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>

                {hasDebt && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setIsPaymentOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Realizar Pago
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Crédito Disponible */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Crédito Disponible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(account.available_credit)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {account.available_credit > 0
                      ? 'Puedes hacer pedidos fiados'
                      : 'Debes pagar para hacer pedidos fiados'}
                  </p>
                </div>

                {pending_orders.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Pedidos Pendientes</p>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{pending_orders.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cargado
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalCharged)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pedidos fiados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pagado
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagos realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transacciones
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.transactionCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de movimientos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para Historial y Pedidos Pendientes */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">
              Historial de Transacciones
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pedidos Pendientes ({pending_orders.length})
            </TabsTrigger>
          </TabsList>

          {/* Historial de Transacciones */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Transacciones</CardTitle>
                <CardDescription>
                  Todos tus movimientos de crédito en orden cronológico
                </CardDescription>
              </CardHeader>
              <CardContent>
                {creditHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay transacciones registradas
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditHistory.map((transaction) => (
                          <TableRow key={transaction.history_id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(transaction.created_at).toLocaleString('es-PE', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">
                                {transaction.description}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getTransactionBadgeVariant(transaction.transaction_type)}>
                                {getTransactionTypeLabel(transaction.transaction_type)}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${
                                transaction.transaction_type === 'payment'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {transaction.transaction_type === 'payment' ? '-' : '+'}
                              {formatCurrency(parseFloat(transaction.amount))}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(parseFloat(transaction.balance_after))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pedidos Pendientes */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Pendientes de Pago</CardTitle>
                <CardDescription>
                  Pedidos fiados que aún tienen saldo pendiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pending_orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tienes pedidos pendientes
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Pagado</TableHead>
                          <TableHead className="text-right">Pendiente</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending_orders.map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell className="font-medium">
                              {order.order_number}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {new Date(order.created_at).toLocaleDateString('es-PE')}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(order.total_amount)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(order.credit_paid_amount)}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              {formatCurrency(order.remaining_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  order.payment_status === 'paid' ? 'default' :
                                  order.payment_status === 'partial' ? 'secondary' :
                                  'destructive'
                                }
                              >
                                {order.payment_status === 'paid' ? 'Pagado' :
                                 order.payment_status === 'partial' ? 'Parcial' :
                                 'Pendiente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Pago */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Realizar Pago de Crédito</DialogTitle>
            <DialogDescription>
              Ingresa el monto y método de pago para reducir tu deuda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Deuda actual</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(account.current_balance)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Crédito disponible</p>
                <p className="text-lg font-medium text-green-600">
                  {formatCurrency(account.available_credit)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto a Pagar (S/)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={account.current_balance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {formatCurrency(account.current_balance)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
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

            {(paymentMethod === 'yape' || paymentMethod === 'plin' || paymentMethod === 'transfer') && (
              <div className="space-y-2">
                <Label htmlFor="reference">Referencia de Transacción (Opcional)</Label>
                <Input
                  id="reference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Ej: 123456789"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agrega una nota sobre este pago"
              />
            </div>

            {paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    Nueva deuda:{' '}
                    <span className="font-bold">
                      {formatCurrency(Math.max(0, account.current_balance - parseFloat(paymentAmount)))}
                    </span>
                  </p>
                  <p className="text-sm text-green-900 dark:text-green-100">
                    Crédito disponible:{' '}
                    <span className="font-bold">
                      {formatCurrency(account.available_credit + parseFloat(paymentAmount))}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentOpen(false);
                setPaymentAmount('');
                setTransactionReference('');
                setNotes('');
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Registrar Pago'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
