'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
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
import { Wallet, TrendingDown, TrendingUp, Plus, ArrowUpDown } from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';
import { PaymentMethod } from '@/lib/types';
import { toast } from 'sonner';

export default function AccountPage() {
  const { user } = useAuth();
  const { transactions, addTransaction, updateUserBalance } = useApp();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  const userTransactions = useMemo(() => {
    if (!user) return [];
    return transactions
      .filter((t) => t.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, user]);

  const paymentMethods: PaymentMethod[] = [
    'efectivo',
    'yape',
    'plin',
    'transferencia',
  ];

  const handlePayment = () => {
    if (!user) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    const newBalance = user.balance + amount;
    updateUserBalance(user.id, amount);

    addTransaction({
      userId: user.id,
      type: 'pago',
      amount,
      balance: newBalance,
      description: `Pago recibido - ${getPaymentMethodName(paymentMethod)}`,
      paymentMethod,
      createdBy: user.id,
    });

    toast.success('Pago registrado correctamente');
    setIsPaymentOpen(false);
    setPaymentAmount('');
  };

  const stats = useMemo(() => {
    const totalSpent = userTransactions
      .filter((t) => t.type === 'compra' || t.type === 'fiado')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalPaid = userTransactions
      .filter((t) => t.type === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalSpent, totalPaid };
  }, [userTransactions]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Cuenta</h1>
          <p className="text-muted-foreground">
            Gestiona tu balance y revisa tu historial
          </p>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Balance Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">
                  {formatCurrency(user?.balance || 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {(user?.balance || 0) < 0
                    ? 'Deuda pendiente - Por favor realiza un pago'
                    : 'Saldo disponible'}
                </p>
              </div>
              {(user?.balance || 0) < 0 && (
                <Button size="lg" onClick={() => setIsPaymentOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Realizar Pago
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gastado
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalSpent)}
              </div>
              <p className="text-xs text-muted-foreground">
                Compras realizadas
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
              <div className="text-2xl font-bold">
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
                {userTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de movimientos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Historial */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>
              Todos tus movimientos en orden cronológico
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userTransactions.length === 0 ? (
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
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleString('es-PE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {transaction.description}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {transaction.type === 'compra' && 'Compra'}
                              {transaction.type === 'pago' && 'Pago'}
                              {transaction.type === 'fiado' && 'Fiado'}
                              {transaction.type === 'ajuste' && 'Ajuste'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.paymentMethod
                            ? getPaymentMethodName(transaction.paymentMethod)
                            : '-'}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.amount > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transaction.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de pago */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Realizar Pago</DialogTitle>
            <DialogDescription>
              Ingresa el monto y método de pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Deuda actual</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(user?.balance || 0)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto a Pagar (S/)</Label>
              <Input
                id="amount"
                type="number"
                step="0.5"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

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

            {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  Nuevo balance:{' '}
                  <span className="font-bold">
                    {formatCurrency(
                      (user?.balance || 0) + parseFloat(paymentAmount)
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentOpen(false);
                setPaymentAmount('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handlePayment}>Registrar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
