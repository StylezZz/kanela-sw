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
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { weeklyMenusApi } from '@/lib/api';
import type {
  WeeklyMenuBackend,
  MenuReservationBackend,
  MenuWaitlist,
  CreateWeeklyMenuDTO,
  ReservationStatus,
} from '@/lib/types';

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `S/ ${num.toFixed(2)}`;
};

const formatDate = (dateStr: string) => {
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
  const [myWaitlist, setMyWaitlist] = useState<MenuWaitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<WeeklyMenuBackend | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenuBackend | null>(null);

  const [formData, setFormData] = useState<CreateWeeklyMenuDTO>({
    menu_date: '',
    entry_description: '',
    main_course_description: '',
    drink_description: '',
    dessert_description: '',
    description: '',
    price: 0,
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
        const waitlist = await weeklyMenusApi.getMyWaitlist();
        setMyWaitlist(waitlist);
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
      setFormData({
        menu_date: '',
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

  const handleOpenWaitlistDialog = (menu: WeeklyMenuBackend) => {
    setSelectedMenu(menu);
    setReserveNotes('');
    setReserveQuantity(1);
    setIsWaitlistDialogOpen(true);
  };

  const handleJoinWaitlist = async () => {
    if (!selectedMenu) return;

    try {
      await weeklyMenusApi.joinWaitlist(selectedMenu.menu_id, {
        quantity: reserveQuantity,
        notes: reserveNotes || undefined,
      });
      toast.success('Agregado a la lista de espera');
      setIsWaitlistDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al unirse a la lista de espera');
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

  const handleLeaveWaitlist = async (waitlistId: string) => {
    if (!confirm('¿Salir de la lista de espera?')) return;

    try {
      await weeklyMenusApi.leaveWaitlist(waitlistId);
      toast.success('Eliminado de la lista de espera');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al salir de la lista');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await weeklyMenusApi.getTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_menus_semanales.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Error al descargar la plantilla');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await weeklyMenusApi.importFromExcel(file);
      toast.success(`Importados ${result.successful} menús`);
      if (result.errors.length > 0) {
        result.errors.forEach((err) => toast.error(err));
      }
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Error al importar');
    }
    e.target.value = '';
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const variants: Record<ReservationStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
      pending: { variant: 'secondary', icon: Clock },
      confirmed: { variant: 'default', icon: CheckCircle },
      delivered: { variant: 'outline', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUserReservation = (menuId: string) => {
    return myReservations.find(
      (r) => r.menu_id === menuId && r.status !== 'cancelled'
    );
  };

  const getUserWaitlist = (menuId: string) => {
    return myWaitlist.find(
      (w) => w.menu_id === menuId && w.status === 'waiting'
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
              {isAdmin
                ? 'Gestiona los menús semanales'
                : 'Reserva tus almuerzos de la semana'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Plantilla
                </Button>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleImportExcel}
                  />
                </label>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Menú
                </Button>
              </>
            )}
          </div>
        </div>

        {isAdmin ? (
          // Vista Admin: Lista de menús con gestión
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
                    <div className="flex items-start justify-between">
                      <Badge variant="outline">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(menu.menu_date)}
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
                      <span className="text-xs text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Hasta: {formatDateTime(menu.reservation_deadline)}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(menu)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
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
          // Vista Usuario: Menús disponibles y mis reservaciones
          <Tabs defaultValue="available">
            <TabsList>
              <TabsTrigger value="available">Menús Disponibles</TabsTrigger>
              <TabsTrigger value="reservations">
                Mis Reservaciones ({myReservations.filter(r => r.status !== 'cancelled').length})
              </TabsTrigger>
              <TabsTrigger value="waitlist">
                Lista de Espera ({myWaitlist.filter(w => w.status === 'waiting').length})
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
                    const inWaitlist = getUserWaitlist(menu.menu_id);
                    const isFull = menu.max_reservations && menu.current_reservations >= menu.max_reservations;
                    const canReserve = menu.can_reserve && !hasReservation && !isFull;

                    return (
                      <Card key={menu.menu_id} className={hasReservation ? 'border-primary' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <Badge variant="outline">
                              <Calendar className="mr-1 h-3 w-3" />
                              {formatDate(menu.menu_date)}
                            </Badge>
                            {hasReservation && (
                              <Badge className="bg-primary">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Reservado
                              </Badge>
                            )}
                            {inWaitlist && !hasReservation && (
                              <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                En espera
                              </Badge>
                            )}
                            {isFull && !hasReservation && !inWaitlist && (
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
                          <div className="text-xs text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            Reservar hasta: {formatDateTime(menu.reservation_deadline)}
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
                          ) : isFull && !inWaitlist ? (
                            <Button variant="secondary" className="w-full" onClick={() => handleOpenWaitlistDialog(menu)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Unirse a Lista de Espera
                            </Button>
                          ) : inWaitlist ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleLeaveWaitlist(inWaitlist.waitlist_id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Salir de Lista de Espera
                            </Button>
                          ) : (
                            <Button disabled className="w-full">
                              No disponible
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

            <TabsContent value="waitlist" className="mt-4">
              <div className="space-y-4">
                {myWaitlist.filter(w => w.status === 'waiting').length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No estás en ninguna lista de espera</p>
                    </CardContent>
                  </Card>
                ) : (
                  myWaitlist
                    .filter(w => w.status === 'waiting')
                    .map((waitlist) => (
                      <Card key={waitlist.waitlist_id}>
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="space-y-1">
                            <span className="font-medium">
                              {waitlist.menu ? formatDate(waitlist.menu.menu_date) : 'Menú'}
                            </span>
                            {waitlist.menu && (
                              <p className="text-sm text-muted-foreground">
                                {waitlist.menu.main_course_description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Cantidad solicitada: {waitlist.quantity}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLeaveWaitlist(waitlist.waitlist_id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Salir
                          </Button>
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
              <Label htmlFor="description">Descripción del Menú</Label>
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
            <Button onClick={handleSaveMenu}>{editingMenu ? 'Guardar cambios' : 'Crear menú'}</Button>
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

      {/* Dialog: Lista de Espera (Usuario) */}
      <Dialog open={isWaitlistDialogOpen} onOpenChange={setIsWaitlistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unirse a Lista de Espera</DialogTitle>
            <DialogDescription>
              Te notificaremos si hay disponibilidad
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedMenu && (
              <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
                <p><strong>{formatDate(selectedMenu.menu_date)}</strong></p>
                <p>{selectedMenu.main_course_description}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="wl-quantity">Cantidad</Label>
              <Input
                id="wl-quantity"
                type="number"
                min="1"
                value={reserveQuantity}
                onChange={(e) => setReserveQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wl-notes">Notas (opcional)</Label>
              <Textarea
                id="wl-notes"
                value={reserveNotes}
                onChange={(e) => setReserveNotes(e.target.value)}
                placeholder="Avísenme si hay cupo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWaitlistDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleJoinWaitlist}>Unirse a la Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
