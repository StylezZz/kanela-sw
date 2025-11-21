/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { weeklyMenusApi } from '@/lib/api';
import type {
  WeeklyMenuBackend,
  MenuReservationBackend,
  CreateWeeklyMenuDTO,
  ReservationStatus,
} from '@/lib/types';

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `S/ ${num.toFixed(2)}`;
};

const formatDate = (dateStr: string) => {
  // Manejar tanto formato ISO completo (2025-11-17T05:00:00.000Z) 
  // como formato simple (2025-11-17)
  const date = new Date(dateStr);
  
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MenuPage() {
  const { user, isAdmin } = useAuth();
  const [menus, setMenus] = useState<WeeklyMenuBackend[]>([]);
  const [myReservations, setMyReservations] = useState<MenuReservationBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isReservationsDialogOpen, setIsReservationsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<WeeklyMenuBackend | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenuBackend | null>(null);
  const [menuReservations, setMenuReservations] = useState<MenuReservationBackend[]>([]);

  const [formData, setFormData] = useState<CreateWeeklyMenuDTO>({
    menu_date: '',
    entry_description: '',
    main_course_description: '',
    drink_description: '',
    dessert_description: '',
    description: '',
    price: 8.5,
    max_reservations: 30,
  });

  const [reserveNotes, setReserveNotes] = useState('');
  const [reserveQuantity, setReserveQuantity] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { menus: fetchedMenus } = await weeklyMenusApi.getAll({ active: true });
      setMenus(fetchedMenus);

      if (user && !isAdmin) {
        const reservations = await weeklyMenusApi.getMyReservations();
        setMyReservations(reservations);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      toast.error('Error al cargar los menús');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (menu?: WeeklyMenuBackend) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        menu_date: menu.menu_date,
        entry_description: menu.entry_description,
        main_course_description: menu.main_course_description,
        drink_description: menu.drink_description,
        dessert_description: menu.dessert_description,
        description: menu.description || '',
        price: parseFloat(menu.price),
        max_reservations: menu.max_reservations,
      });
    } else {
      setEditingMenu(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        menu_date: tomorrow.toISOString().split('T')[0],
        entry_description: '',
        main_course_description: '',
        drink_description: '',
        dessert_description: '',
        description: '',
        price: 8.5,
        max_reservations: 30,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveMenu = async () => {
    if (!formData.menu_date || !formData.main_course_description || !formData.price) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      if (editingMenu) {
        await weeklyMenusApi.update(editingMenu.menu_id, formData);
        toast.success('Menú actualizado correctamente');
      } else {
        await weeklyMenusApi.create(formData);
        toast.success('Menú creado correctamente');
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el menú');
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('¿Estás seguro de eliminar este menú?')) return;

    try {
      await weeklyMenusApi.delete(menuId);
      toast.success('Menú eliminado');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el menú');
    }
  };

  const handleOpenReserveDialog = (menu: WeeklyMenuBackend) => {
    setSelectedMenu(menu);
    setReserveNotes('');
    setReserveQuantity(1);
    setIsReserveDialogOpen(true);
  };

  const handleReserve = async () => {
    if (!selectedMenu) return;

    try {
      await weeklyMenusApi.createReservation(selectedMenu.menu_id, {
        quantity: reserveQuantity,
        notes: reserveNotes || undefined,
      });
      toast.success('Reservación creada correctamente');
      setIsReserveDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la reservación');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('¿Cancelar esta reservación?')) return;

    try {
      await weeklyMenusApi.cancelMyReservation(reservationId);
      toast.success('Reservación cancelada');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar');
    }
  };

  const handleViewReservations = async (menu: WeeklyMenuBackend) => {
    setSelectedMenu(menu);
    try {
      const { reservations } = await weeklyMenusApi.getMenuReservations(menu.menu_id);
      setMenuReservations(reservations);
      setIsReservationsDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar reservaciones');
    }
  };

  const handleUpdateReservationStatus = async (reservationId: string, status: ReservationStatus) => {
    try {
      await weeklyMenusApi.updateReservationStatus(reservationId, status);
      toast.success('Estado actualizado');
      if (selectedMenu) {
        const { reservations } = await weeklyMenusApi.getMenuReservations(selectedMenu.menu_id);
        setMenuReservations(reservations);
      }
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado');
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const config: Record<ReservationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendiente' },
      confirmed: { variant: 'default', label: 'Confirmado' },
      delivered: { variant: 'outline', label: 'Entregado' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getUserReservation = (menuId: string) => {
    return myReservations.find(
      (r) => r.menu_id === menuId && r.status !== 'cancelled'
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Menú Semanal</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Gestiona los menús semanales' : 'Reserva tus almuerzos de la semana'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            {isAdmin && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Menú
              </Button>
            )}
          </div>
        </div>

        {isAdmin ? (
          // Vista Admin
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menus.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay menús configurados</p>
                  <Button className="mt-4" onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer menú
                  </Button>
                </CardContent>
              </Card>
            ) : (
              menus.map((menu) => (
                <Card key={menu.menu_id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">Menú: {formatDate(menu.menu_date)}</span>
                      </Badge>
                      <Badge variant={menu.can_reserve ? 'default' : 'secondary'}>
                        <Users className="mr-1 h-3 w-3" />
                        {menu.current_reservations}/{menu.max_reservations || '∞'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{menu.description || 'Menú del día'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Entrada:</span> {menu.entry_description}</div>
                    <div><span className="text-muted-foreground">Plato:</span> {menu.main_course_description}</div>
                    <div><span className="text-muted-foreground">Bebida:</span> {menu.drink_description}</div>
                    <div><span className="text-muted-foreground">Postre:</span> {menu.dessert_description}</div>
                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">{formatCurrency(menu.price)}</span>
                      <div className="text-xs text-muted-foreground text-right">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Reservar hasta:</span>
                        </div>
                        <div className="font-medium">{formatDateTime(menu.reservation_deadline)}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewReservations(menu)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver ({menu.current_reservations})
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(menu)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteMenu(menu.menu_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        ) : (
          // Vista Usuario
          <Tabs defaultValue="available">
            <TabsList>
              <TabsTrigger value="available">Menús Disponibles</TabsTrigger>
              <TabsTrigger value="reservations">
                Mis Reservaciones ({myReservations.filter(r => r.status !== 'cancelled').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menus.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay menús disponibles esta semana</p>
                    </CardContent>
                  </Card>
                ) : (
                  menus.map((menu) => {
                    const hasReservation = getUserReservation(menu.menu_id);
                    const isFull = menu.max_reservations && menu.current_reservations >= menu.max_reservations;
                    const canReserve = menu.can_reserve && !hasReservation && !isFull;

                    return (
                      <Card key={menu.menu_id} className={hasReservation ? 'border-primary' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">Menú: {formatDate(menu.menu_date)}</span>
                            </Badge>
                            {hasReservation && (
                              <Badge className="bg-primary">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Reservado
                              </Badge>
                            )}
                            {isFull && !hasReservation && (
                              <Badge variant="destructive">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Lleno
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mt-2">{menu.description || 'Menú del día'}</CardTitle>
                          <CardDescription>
                            {menu.current_reservations}/{menu.max_reservations || '∞'} reservaciones
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Entrada:</span> {menu.entry_description}</div>
                          <div><span className="text-muted-foreground">Plato:</span> {menu.main_course_description}</div>
                          <div><span className="text-muted-foreground">Bebida:</span> {menu.drink_description}</div>
                          <div><span className="text-muted-foreground">Postre:</span> {menu.dessert_description}</div>
                          <div className="pt-2 border-t">
                            <span className="text-xl font-bold text-primary">{formatCurrency(menu.price)}</span>
                          </div>
                          <div className="pt-1 space-y-1">
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Límite para reservar:</span>
                            </div>
                            <div className="text-xs font-medium">
                              {formatDateTime(menu.reservation_deadline)}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          {hasReservation ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleCancelReservation(hasReservation.reservation_id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar Reservación
                            </Button>
                          ) : canReserve ? (
                            <Button className="w-full" onClick={() => handleOpenReserveDialog(menu)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reservar
                            </Button>
                          ) : (
                            <Button disabled className="w-full">
                              {isFull ? 'Sin cupos' : 'No disponible'}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="reservations" className="mt-4">
              <div className="space-y-4">
                {myReservations.filter(r => r.status !== 'cancelled').length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tienes reservaciones activas</p>
                    </CardContent>
                  </Card>
                ) : (
                  myReservations
                    .filter(r => r.status !== 'cancelled')
                    .map((reservation) => (
                      <Card key={reservation.reservation_id}>
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {reservation.menu ? formatDate(reservation.menu.menu_date) : 'Menú'}
                              </span>
                              {getStatusBadge(reservation.status)}
                            </div>
                            {reservation.menu && (
                              <p className="text-sm text-muted-foreground">
                                {reservation.menu.main_course_description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Cantidad: {reservation.quantity} | Total: {formatCurrency(reservation.total_amount)}
                            </p>
                          </div>
                          {reservation.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelReservation(reservation.reservation_id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog: Crear/Editar Menú (Admin) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingMenu ? 'Editar Menú' : 'Nuevo Menú'}</DialogTitle>
            <DialogDescription>Configura el menú del día</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="menu_date">Fecha *</Label>
              <Input
                id="menu_date"
                type="date"
                value={formData.menu_date}
                onChange={(e) => setFormData({ ...formData, menu_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Menú del Lunes - Clásico Peruano"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entry">Entrada *</Label>
              <Input
                id="entry"
                value={formData.entry_description}
                onChange={(e) => setFormData({ ...formData, entry_description: e.target.value })}
                placeholder="Ej: Ensalada César"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="main">Plato Principal *</Label>
              <Input
                id="main"
                value={formData.main_course_description}
                onChange={(e) => setFormData({ ...formData, main_course_description: e.target.value })}
                placeholder="Ej: Lomo saltado con arroz"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drink">Bebida *</Label>
              <Input
                id="drink"
                value={formData.drink_description}
                onChange={(e) => setFormData({ ...formData, drink_description: e.target.value })}
                placeholder="Ej: Chicha morada"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dessert">Postre *</Label>
              <Input
                id="dessert"
                value={formData.dessert_description}
                onChange={(e) => setFormData({ ...formData, dessert_description: e.target.value })}
                placeholder="Ej: Mazamorra morada"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio (S/) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.5"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max">Cupo Máximo</Label>
                <Input
                  id="max"
                  type="number"
                  value={formData.max_reservations || ''}
                  onChange={(e) => setFormData({ ...formData, max_reservations: parseInt(e.target.value) || undefined })}
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMenu}>{editingMenu ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reservar (Usuario) */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar Menú</DialogTitle>
            <DialogDescription>
              {selectedMenu && formatDate(selectedMenu.menu_date)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedMenu && (
              <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
                <p><strong>Entrada:</strong> {selectedMenu.entry_description}</p>
                <p><strong>Plato:</strong> {selectedMenu.main_course_description}</p>
                <p><strong>Bebida:</strong> {selectedMenu.drink_description}</p>
                <p><strong>Postre:</strong> {selectedMenu.dessert_description}</p>
                <p className="text-lg font-bold text-primary pt-2">{formatCurrency(selectedMenu.price)}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={reserveQuantity}
                onChange={(e) => setReserveQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={reserveNotes}
                onChange={(e) => setReserveNotes(e.target.value)}
                placeholder="Ej: Sin picante por favor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleReserve}>Confirmar Reservación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Reservaciones del Menú (Admin) */}
      <Dialog open={isReservationsDialogOpen} onOpenChange={setIsReservationsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reservaciones</DialogTitle>
            <DialogDescription>
              {selectedMenu && `${formatDate(selectedMenu.menu_date)} - ${selectedMenu.current_reservations} reservaciones`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-3">
            {menuReservations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay reservaciones</p>
            ) : (
              menuReservations.map((res) => (
                <div key={res.reservation_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{res.user?.full_name || 'Usuario'}</p>
                    <p className="text-sm text-muted-foreground">
                      Cantidad: {res.quantity} | {formatCurrency(res.total_amount)}
                    </p>
                    {res.notes && <p className="text-xs text-muted-foreground">Nota: {res.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(res.status)}
                    {res.status !== 'cancelled' && res.status !== 'delivered' && (
                      <Select
                        value={res.status}
                        onValueChange={(value) => handleUpdateReservationStatus(res.reservation_id, value as ReservationStatus)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmar</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="cancelled">Cancelar</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReservationsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
