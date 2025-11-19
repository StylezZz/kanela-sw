'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, UserPlus, Download, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { User, CreateUserDTO } from '@/lib/types';
import { formatCurrency } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const { users, fetchUsers } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{ created: number; errors: string[] } | null>(null);

  // Estado del formulario de nuevo usuario
  const [newUser, setNewUser] = useState<CreateUserDTO>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'customer',
    has_credit_account: false,
    credit_limit: 0,
  });

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  // Manejar creación de usuario individual
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.users.create(newUser);
      await fetchUsers();

      toast({
        title: 'Usuario creado',
        description: 'El usuario ha sido creado exitosamente',
      });

      // Resetear formulario
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'customer',
        has_credit_account: false,
        credit_limit: 0,
      });
      setShowAddDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear usuario',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar carga masiva
  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.users.bulkUpload(uploadFile);
      setUploadResult(result);
      await fetchUsers();

      toast({
        title: 'Carga completada',
        description: `Se crearon ${result.created} usuario(s)`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error en la carga masiva',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar eliminación de usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      await api.users.delete(selectedUser.user_id);
      await fetchUsers();

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente',
      });

      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar usuario',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Descargar plantilla de Excel
  const downloadTemplate = () => {
    const csvContent = 'email,full_name,phone,password,role,credit_limit\n' +
      'usuario@example.com,Juan Pérez,+51999999999,password123,customer,100.00\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_usuarios.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Plantilla descargada',
      description: 'La plantilla ha sido descargada exitosamente',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra los usuarios del sistema
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
            <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Carga Masiva
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
            <CardDescription>
              Total de usuarios: {users.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Límite Crédito</TableHead>
                  <TableHead>Balance Actual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Cliente'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(user.credit_limit))}</TableCell>
                      <TableCell>
                        <span className={parseFloat(user.current_balance) < 0 ? 'text-red-600 font-semibold' : ''}>
                          {formatCurrency(parseFloat(user.current_balance))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.account_status === 'active'
                              ? 'default'
                              : user.account_status === 'suspended'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {user.account_status === 'active' ? 'Activo' :
                           user.account_status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para agregar usuario individual */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                placeholder="Juan Pérez"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+51999999999"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: 'admin' | 'customer') =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_limit">Límite de Crédito</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newUser.credit_limit}
                onChange={(e) =>
                  setNewUser({ ...newUser, credit_limit: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para carga masiva */}
      <Dialog
        open={showBulkUploadDialog}
        onOpenChange={(open) => {
          setShowBulkUploadDialog(open);
          if (!open) {
            setUploadFile(null);
            setUploadResult(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carga Masiva de Usuarios</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV o Excel con los datos de los usuarios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="max-w-xs mx-auto"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Formatos aceptados: CSV, XLSX, XLS
              </p>
            </div>

            {uploadFile && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Archivo seleccionado:</p>
                <p className="text-sm text-muted-foreground">{uploadFile.name}</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Formato del archivo
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                El archivo debe contener las siguientes columnas en orden:
              </p>
              <ul className="text-xs space-y-1 ml-6 list-disc">
                <li><strong>email</strong>: Correo electrónico del usuario</li>
                <li><strong>full_name</strong>: Nombre completo</li>
                <li><strong>phone</strong>: Número de teléfono (opcional)</li>
                <li><strong>password</strong>: Contraseña</li>
                <li><strong>role</strong>: Rol (admin o customer)</li>
                <li><strong>credit_limit</strong>: Límite de crédito (número)</li>
              </ul>
            </div>

            {uploadResult && (
              <div className="space-y-2">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <p className="text-sm font-semibold flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    {uploadResult.created} usuario(s) creado(s) exitosamente
                  </p>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                      Errores encontrados:
                    </p>
                    <ul className="text-xs space-y-1 ml-6 list-disc">
                      {uploadResult.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>...y {uploadResult.errors.length - 5} errores más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUploadDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={handleBulkUpload} disabled={isLoading || !uploadFile}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir Archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario{' '}
              <strong>{selectedUser?.full_name}</strong> será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
