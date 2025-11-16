'use client';

import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Users } from 'lucide-react';
import { formatCurrency, getDayName } from '@/lib/data';
import { WeeklyMenu, WeekDay } from '@/lib/types';
import { toast } from 'sonner';

export default function MenuPage() {
  const { user, isAdmin } = useAuth();
  const { weeklyMenu, addMenuItem, updateMenuItem, deleteMenuItem, addReservation, reservations } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<WeeklyMenu | null>(null);

  const [formData, setFormData] = useState({
    day: 'lunes' as WeekDay,
    mainDish: '',
    side: '',
    drink: '',
    dessert: '',
    price: '',
  });

  const days: WeekDay[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  const sortedMenu = [...weeklyMenu].sort((a, b) => {
    return days.indexOf(a.day) - days.indexOf(b.day);
  });

  const handleOpenDialog = (menu?: WeeklyMenu) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        day: menu.day,
        mainDish: menu.mainDish,
        side: menu.side,
        drink: menu.drink,
        dessert: menu.dessert || '',
        price: menu.price.toString(),
      });
    } else {
      setEditingMenu(null);
      setFormData({
        day: 'lunes',
        mainDish: '',
        side: '',
        drink: '',
        dessert: '',
        price: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveMenu = () => {
    if (!formData.mainDish || !formData.side || !formData.drink || !formData.price) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const menuData = {
      day: formData.day,
      mainDish: formData.mainDish,
      side: formData.side,
      drink: formData.drink,
      dessert: formData.dessert || undefined,
      price: parseFloat(formData.price),
      week: '2025-W47',
      available: true,
    };

    if (editingMenu) {
      updateMenuItem(editingMenu.id, menuData);
      toast.success('Menú actualizado correctamente');
    } else {
      addMenuItem(menuData);
      toast.success('Menú agregado correctamente');
    }

    setIsDialogOpen(false);
    setEditingMenu(null);
  };

  const handleDeleteMenu = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este menú?')) {
      deleteMenuItem(id);
      toast.success('Menú eliminado');
    }
  };

  const handleReserveMenu = (menu: WeeklyMenu) => {
    if (!user) return;

    // Verificar si ya tiene una reserva para este menú
    const existingReservation = reservations.find(
      (r) => r.userId === user.id && r.menuId === menu.id && r.status !== 'cancelled'
    );

    if (existingReservation) {
      toast.info('Ya tienes una reserva para este día');
      return;
    }

    addReservation({
      userId: user.id,
      menuId: menu.id,
      date: new Date(),
      status: 'confirmed',
    });

    toast.success(`Menú de ${getDayName(menu.day)} reservado correctamente`);
  };

  const getUserReservation = (menuId: string) => {
    if (!user) return null;
    return reservations.find(
      (r) => r.userId === user.id && r.menuId === menuId && r.status !== 'cancelled'
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Menú Semanal</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Gestiona el menú de la semana'
                : 'Reserva tus almuerzos de la semana'}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Menú
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingMenu ? 'Editar Menú' : 'Nuevo Menú'}
                  </DialogTitle>
                  <DialogDescription>
                    Configura el menú del día
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="day">Día *</Label>
                    <Select
                      value={formData.day}
                      onValueChange={(value) =>
                        setFormData({ ...formData, day: value as WeekDay })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>
                            {getDayName(day)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mainDish">Plato Principal *</Label>
                    <Input
                      id="mainDish"
                      value={formData.mainDish}
                      onChange={(e) =>
                        setFormData({ ...formData, mainDish: e.target.value })
                      }
                      placeholder="Ej: Lomo Saltado"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="side">Acompañamiento *</Label>
                    <Input
                      id="side"
                      value={formData.side}
                      onChange={(e) =>
                        setFormData({ ...formData, side: e.target.value })
                      }
                      placeholder="Ej: Arroz blanco y papas fritas"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="drink">Bebida *</Label>
                    <Input
                      id="drink"
                      value={formData.drink}
                      onChange={(e) =>
                        setFormData({ ...formData, drink: e.target.value })
                      }
                      placeholder="Ej: Chicha morada"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dessert">Postre (opcional)</Label>
                    <Input
                      id="dessert"
                      value={formData.dessert}
                      onChange={(e) =>
                        setFormData({ ...formData, dessert: e.target.value })
                      }
                      placeholder="Ej: Mazamorra morada"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Precio (S/) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.5"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveMenu}>
                    {editingMenu ? 'Guardar cambios' : 'Crear menú'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {sortedMenu.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay menú configurado para esta semana
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {sortedMenu.map((menu) => {
              const hasReservation = getUserReservation(menu.id);

              return (
                <Card
                  key={menu.id}
                  className={`flex flex-col ${
                    hasReservation ? 'border-primary shadow-sm' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-base">
                        <Calendar className="mr-1 h-3 w-3" />
                        {getDayName(menu.day)}
                      </Badge>
                      {isAdmin && (
                        <Badge variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {menu.reservations}
                        </Badge>
                      )}
                      {hasReservation && !isAdmin && (
                        <Badge className="bg-primary">Reservado</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">Menú del día</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Plato Principal
                      </p>
                      <p className="text-sm font-semibold">{menu.mainDish}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Acompañamiento
                      </p>
                      <p className="text-sm">{menu.side}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Bebida
                      </p>
                      <p className="text-sm">{menu.drink}</p>
                    </div>
                    {menu.dessert && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Postre
                        </p>
                        <p className="text-sm">{menu.dessert}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(menu.price)}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(menu)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMenu(menu.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleReserveMenu(menu)}
                        disabled={!!hasReservation}
                        variant={hasReservation ? 'secondary' : 'default'}
                      >
                        {hasReservation ? 'Reservado' : 'Reservar'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {!isAdmin && reservations.filter(r => r.userId === user?.id && r.status === 'confirmed').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Reservas</CardTitle>
              <CardDescription>
                Tienes {reservations.filter(r => r.userId === user?.id && r.status === 'confirmed').length} reserva(s) confirmada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reservations
                  .filter(r => r.userId === user?.id && r.status === 'confirmed')
                  .map((reservation) => {
                    const menu = weeklyMenu.find(m => m.id === reservation.menuId);
                    if (!menu) return null;
                    return (
                      <div key={reservation.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{getDayName(menu.day)}</p>
                          <p className="text-sm text-muted-foreground">{menu.mainDish}</p>
                        </div>
                        <p className="font-bold">{formatCurrency(menu.price)}</p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
