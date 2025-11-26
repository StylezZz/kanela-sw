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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Wallet,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Download,
  AlertCircle,
  Loader2,
  DollarSign,
  Settings,
  Receipt,
  History,
  Edit,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatCurrency, getPaymentMethodName } from '@/lib/data';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type {
  UserWithDebt,
  AdminCreditPaymentDTO,
  EnableCreditDTO,
  UpdateCreditLimitDTO,
  AdjustDebtDTO,
  CreditHistory,
  PendingCreditOrder,
  User,
} from '@/lib/types';

export default function CreditManagementPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  // Estados principales
  const [usersWithDebt, setUsersWithDebt] = useState<UserWithDebt[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_debt' | 'no_debt'>('all');

  // Estados de dialogs
  const [selectedUser, setSelectedUser] = useState<UserWithDebt | User | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
  const [isAdjustDebtDialogOpen, setIsAdjustDebtDialogOpen] = useState(false);
  const [isEnableCreditDialogOpen, setIsEnableCreditDialogOpen] = useState(false);
  const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false);

  // Estados de datos de usuario seleccionado
  const [userHistory, setUserHistory] = useState<CreditHistory[]>([]);
  const [userPendingOrders, setUserPendingOrders] = useState<PendingCreditOrder[]>([]);

  // Estados de formularios
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<AdminCreditPaymentDTO>({
    user_id: '',
    amount: 0,
    payment_method: 'cash',
  });
  const [limitData, setLimitData] = useState<UpdateCreditLimitDTO>({ new_limit: 0 });
  const [adjustData, setAdjustDebtDTO] = useState<AdjustDebtDTO>({ amount: 0, reason: '' });
  const [enableData, setEnableData] = useState<EnableCreditDTO>({ credit_limit: 100 });

  // Verificar permisos
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [debtUsers, users] = await Promise.all([
        api.credit.getUsersWithDebt(),
        api.users.getAll(),
      ]);

      setUsersWithDebt(debtUsers.users);
      setAllUsers(users.users);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de crédito');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Cargar detalles del usuario seleccionado
  const loadUserDetails = async (userId: string) => {
    try {
      const [history, pendingOrders] = await Promise.all([
        api.credit.getUserHistory(userId, 50),
        api.credit.getUserPendingOrders(userId),
      ]);

      setUserHistory(history.history);
      setUserPendingOrders(pendingOrders.orders);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      toast.error('Error al cargar los detalles del usuario');
    }
  };

  // Usuarios filtrados
  const filteredUsers = useMemo(() => {
    // Combinar todos los usuarios con información de deuda
    const usersMap = new Map<string, UserWithDebt | User>();

    // Primero agregar usuarios con deuda
    usersWithDebt.forEach(u => usersMap.set(u.user_id, u));

    // Luego agregar el resto de usuarios
    allUsers.forEach(u => {
      if (!usersMap.has(u.user_id)) {
        usersMap.set(u.user_id, u);
      }
    });

    let users = Array.from(usersMap.values());

    // Filtrar por estado
    if (filterStatus === 'with_debt') {
      users = users.filter(u => 'current_balance' in u && u.current_balance > 0);
    } else if (filterStatus === 'no_debt') {
      users = users.filter(u => !('current_balance' in u) || u.current_balance === 0);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      users = users.filter(u =>
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    return users;
  }, [usersWithDebt, allUsers, filterStatus, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    const usersWithDebtCount = usersWithDebt.length;
    const totalDebt = usersWithDebt.reduce((sum, u) => sum + u.current_balance, 0);
    const averageDebt = usersWithDebtCount > 0 ? totalDebt / usersWithDebtCount : 0;

    return {
      totalUsers,
      usersWithDebtCount,
      usersWithoutDebt: totalUsers - usersWithDebtCount,
      totalDebt,
      averageDebt,
    };
  }, [allUsers, usersWithDebt]);

  // Handlers
  const handleRegisterPayment = async () => {
    if (!paymentData.user_id || paymentData.amount <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      setIsProcessing(true);
      await api.credit.registerPayment(paymentData);
      toast.success('Pago registrado correctamente');
      setIsPaymentDialogOpen(false);
      setPaymentData({ user_id: '', amount: 0, payment_method: 'cash' });
      await loadData();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al registrar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!selectedUser || limitData.new_limit <= 0) {
      toast.error('Por favor ingresa un límite válido');
      return;
    }

    try {
      setIsProcessing(true);
      await api.credit.updateCreditLimit(selectedUser.user_id, limitData);
      toast.success('Límite actualizado correctamente');
      setIsLimitDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error al actualizar límite:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el límite');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustDebt = async () => {
    if (!selectedUser || !adjustData.reason) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setIsProcessing(true);
      await api.credit.adjustDebt(selectedUser.user_id, adjustData);
      toast.success('Deuda ajustada correctamente');
      setIsAdjustDebtDialogOpen(false);
      setAdjustDebtDTO({ amount: 0, reason: '' });
      await loadData();
    } catch (error) {
      console.error('Error al ajustar deuda:', error);
      toast.error(error instanceof Error ? error.message : 'Error al ajustar la deuda');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnableCredit = async () => {
    if (!selectedUser || enableData.credit_limit <= 0) {
      toast.error('Por favor ingresa un límite válido');
      return;
    }

    try {
      setIsProcessing(true);
      await api.credit.enableCredit(selectedUser.user_id, enableData);
      toast.success('Crédito activado correctamente');
      setIsEnableCreditDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error al activar crédito:', error);
      toast.error(error instanceof Error ? error.message : 'Error al activar el crédito');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableCredit = async (userId: string) => {
    try {
      await api.credit.disableCredit(userId);
      toast.success('Crédito desactivado correctamente');
      await loadData();
    } catch (error) {
      console.error('Error al desactivar crédito:', error);
      toast.error(error instanceof Error ? error.message : 'Error al desactivar el crédito');
    }
  };

  const handleViewDetails = async (user: UserWithDebt | User) => {
    setSelectedUser(user);
    setIsUserDetailsDialogOpen(true);
    await loadUserDetails(user.user_id);
  };

  const handleDownloadUserReport = async (userId: string) => {
    try {
      toast.info('Descargando reporte...');
      const blob = await api.credit.downloadUserReportPDF(userId, { period: 'monthly' });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-credito-${userId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Reporte descargado');
    } catch (error) {
      console.error('Error al descargar reporte:', error);
      toast.error('Error al descargar el reporte');
    }
  };

  const getUserBalance = (user: UserWithDebt | User): number => {
    return 'current_balance' in user ? user.current_balance : parseFloat(user.current_balance);
  };

  const getUserCreditLimit = (user: UserWithDebt | User): number => {
    return 'credit_limit' in user && typeof user.credit_limit === 'number'
      ? user.credit_limit
      : parseFloat(user.credit_limit);
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando datos de crédito...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Créditos</h1>
            <p className="text-muted-foreground">
              Administra las cuentas de crédito de todos los usuarios
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Con crédito activo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Deuda</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.usersWithDebtCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuarios con saldo pendiente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalDebt)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo total pendiente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.averageDebt)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por usuario con deuda
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Lista completa de usuarios con información de crédito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={(v: typeof filterStatus) => setFilterStatus(v)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  <SelectItem value="with_debt">Con deuda</SelectItem>
                  <SelectItem value="no_debt">Sin deuda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabla de usuarios */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Deuda</TableHead>
                      <TableHead className="text-right">Límite</TableHead>
                      <TableHead className="text-right">Disponible</TableHead>
                      <TableHead className="text-right">Uso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const balance = getUserBalance(user);
                      const limit = getUserCreditLimit(user);
                      const available = limit - balance;
                      const usagePercent = limit > 0 ? ((balance / limit) * 100).toFixed(1) : '0';
                      const hasCredit = user.has_credit_account;

                      return (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            {user.full_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {hasCredit ? (
                              <Badge variant={balance > 0 ? 'destructive' : 'default'}>
                                {balance > 0 ? 'Con deuda' : 'Al día'}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sin crédito</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasCredit ? (
                              <span className={balance > 0 ? 'text-red-600 font-semibold' : ''}>
                                {formatCurrency(balance)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasCredit ? formatCurrency(limit) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasCredit ? (
                              <span className="text-green-600">
                                {formatCurrency(available)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasCredit ? (
                              <span className={
                                parseFloat(usagePercent) >= 90 ? 'text-red-600 font-semibold' :
                                parseFloat(usagePercent) >= 70 ? 'text-yellow-600' :
                                'text-green-600'
                              }>
                                {usagePercent}%
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(user)}
                              >
                                Ver Detalles
                              </Button>
                              {hasCredit ? (
                                <>
                                  {balance > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setPaymentData({
                                          user_id: user.user_id,
                                          amount: 0,
                                          payment_method: 'cash',
                                        });
                                        setIsPaymentDialogOpen(true);
                                      }}
                                    >
                                      <DollarSign className="h-4 w-4 mr-1" />
                                      Pago
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setLimitData({ new_limit: limit });
                                      setIsLimitDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Límite
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsEnableCreditDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Activar Crédito
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Registrar Pago */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Registra un pago realizado por {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto (S/)</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentData.amount || ''}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={paymentData.payment_method}
                onValueChange={(v: typeof paymentData.payment_method) =>
                  setPaymentData({ ...paymentData, payment_method: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="plin">Plin</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notas (Opcional)</Label>
              <Input
                id="payment-notes"
                value={paymentData.notes || ''}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Agrega una nota sobre este pago"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Actualizar Límite */}
      <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Límite de Crédito</DialogTitle>
            <DialogDescription>
              Modifica el límite de crédito para {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-limit">Nuevo Límite (S/)</Label>
              <Input
                id="new-limit"
                type="number"
                step="10"
                value={limitData.new_limit || ''}
                onChange={(e) => setLimitData({ new_limit: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLimitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateLimit} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ajustar Deuda */}
      <Dialog open={isAdjustDebtDialogOpen} onOpenChange={setIsAdjustDebtDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Deuda Manualmente</DialogTitle>
            <DialogDescription>
              Realiza un ajuste manual en la deuda de {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-amount">Monto (positivo aumenta, negativo reduce)</Label>
              <Input
                id="adjust-amount"
                type="number"
                step="0.01"
                value={adjustData.amount || ''}
                onChange={(e) => setAdjustDebtDTO({ ...adjustData, amount: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">Razón del Ajuste</Label>
              <Input
                id="adjust-reason"
                value={adjustData.reason}
                onChange={(e) => setAdjustDebtDTO({ ...adjustData, reason: e.target.value })}
                placeholder="Ej: Descuento por promoción"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDebtDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjustDebt} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ajustar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Activar Crédito */}
      <Dialog open={isEnableCreditDialogOpen} onOpenChange={setIsEnableCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activar Cuenta de Crédito</DialogTitle>
            <DialogDescription>
              Activa el crédito para {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="enable-limit">Límite de Crédito (S/)</Label>
              <Input
                id="enable-limit"
                type="number"
                step="10"
                value={enableData.credit_limit || ''}
                onChange={(e) => setEnableData({ credit_limit: parseFloat(e.target.value) })}
                placeholder="100.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnableCreditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnableCredit} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Activar Crédito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalles de Usuario */}
      <Dialog open={isUserDetailsDialogOpen} onOpenChange={setIsUserDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>
              Historial completo y pedidos pendientes
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="pending">Pedidos Pendientes</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-4">
              {userHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial disponible
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userHistory.map((h) => (
                        <TableRow key={h.history_id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(h.created_at).toLocaleDateString('es-PE')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                h.transaction_type === 'payment' ? 'default' :
                                h.transaction_type === 'charge' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {h.transaction_type === 'payment' ? 'Pago' :
                               h.transaction_type === 'charge' ? 'Cargo' :
                               h.transaction_type === 'adjustment' ? 'Ajuste' :
                               'Límite'}
                            </Badge>
                          </TableCell>
                          <TableCell>{h.description}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {h.transaction_type === 'payment' ? '-' : '+'}
                            {formatCurrency(parseFloat(h.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {userPendingOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay pedidos pendientes
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userPendingOrders.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('es-PE')}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(order.total_amount)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            {formatCurrency(order.remaining_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDownloadUserReport(selectedUser!.user_id)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Reporte PDF
            </Button>
            <Button variant="outline" onClick={() => setIsUserDetailsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
