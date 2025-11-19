/**
 * EJEMPLO DE USO: Componente de Categoría con Upload de Imagen
 *
 * Este es un ejemplo de cómo integrar el componente ImageUpload
 * en un formulario de categorías.
 *
 * Puedes copiar este código y adaptarlo según tus necesidades.
 */

'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { Category } from '@/lib/types';

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryFormExample({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon_url: category?.icon_url || '',
    display_order: category?.display_order?.toString() || '0',
    is_active: category?.is_active ?? true,
  });

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    try {
      if (category) {
        // Editar categoría existente
        await api.categories.update(category.category_id, {
          name: formData.name,
          description: formData.description || undefined,
          icon_url: formData.icon_url || undefined,
          display_order: parseInt(formData.display_order) || 0,
          is_active: formData.is_active,
        });
        toast.success('Categoría actualizada correctamente');
      } else {
        // Crear nueva categoría
        await api.categories.create({
          name: formData.name,
          description: formData.description || undefined,
          icon_url: formData.icon_url || undefined,
          display_order: parseInt(formData.display_order) || 0,
          is_active: formData.is_active,
        });
        toast.success('Categoría creada correctamente');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error guardando categoría:', error);
      toast.error('Error al guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Bebidas"
          disabled={isSaving}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción de la categoría"
          rows={3}
          disabled={isSaving}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="display_order">Orden de visualización</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
          placeholder="0"
          disabled={isSaving}
        />
      </div>

      {/* Componente de Upload de Imagen */}
      <div className="grid gap-2">
        <ImageUpload
          label="Icono de Categoría"
          value={formData.icon_url}
          onChange={(url) => setFormData({ ...formData, icon_url: url })}
          onRemove={() => setFormData({ ...formData, icon_url: '' })}
          folder="categories"
          disabled={isSaving}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </div>
  );
}

/**
 * USO EN UN DIALOG:
 *
 * <Dialog>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Nueva Categoría</DialogTitle>
 *     </DialogHeader>
 *     <CategoryFormExample
 *       onSuccess={() => {
 *         setIsDialogOpen(false);
 *         loadCategories(); // Recargar lista
 *       }}
 *       onCancel={() => setIsDialogOpen(false)}
 *     />
 *   </DialogContent>
 * </Dialog>
 */
