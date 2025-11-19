/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  ShoppingCart,
  Edit,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { formatCurrency, getCategoryName } from "@/lib/data";
import { Product, Category } from "@/lib/types";
import { toast } from "sonner";
import api from "@/lib/api";
import { ImageUpload } from "@/components/upload/ImageUpload";

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();

  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    stock: "",
    image_url: "",
    thumbnail_url: "",
  });

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      console.log("Cargando categorías...");

      const response = await api.categories.getAll();
      console.log("Respuesta:", response);
      setCategories(response);
    } catch (error) {
      console.error("Error cargando categorías:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Cargar productos desde la API
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.products.getAll();
      setProducts(response.products);
    } catch (error) {
      console.error("Error cargando productos:", error);
      toast.error("Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const categoryNames: string[] = [
    "almuerzos",
    "bebidas",
    "snacks",
    "postres",
    "utiles",
    "otros",
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: parseFloat(product.price).toString(),
        category_id: product.category_id,
        stock: product.stock_quantity.toString(),
        image_url: product.image_url || "",
        thumbnail_url: product.thumbnail_url || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        stock: "",
        image_url: "",
        thumbnail_url: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsSaving(true);
    try {
      if (editingProduct) {
        await api.products.update(editingProduct.product_id, {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          stock_quantity: parseInt(formData.stock),
          image_url: formData.image_url || undefined,
          thumbnail_url: formData.thumbnail_url || undefined,
        });
        toast.success("Producto actualizado correctamente");
      } else {
        await api.products.create({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          stock_quantity: parseInt(formData.stock),
          is_available: true,
          image_url: formData.image_url || undefined,
          thumbnail_url: formData.thumbnail_url || undefined,
        });
        toast.success("Producto agregado correctamente");
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      loadProducts(); // Recargar lista
    } catch (error) {
      console.error("Error guardando producto:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) {
      return;
    }

    try {
      await api.products.delete(id);
      toast.success("Producto eliminado");
      loadProducts(); // Recargar lista
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} agregado al carrito`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Productos</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "Gestiona el catálogo de productos"
                : "Explora nuestro catálogo"}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </DialogTitle>
                  <DialogDescription>
                    Completa la información del producto
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ej: Hamburguesa Clásica"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descripción del producto"
                      rows={3}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Precio (S/) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.1"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0.00"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        placeholder="0"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoría *</Label>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Cargando categorías...
                      </p>
                    ) : (
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category_id: value })
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat.category_id}
                              value={cat.category_id}
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <ImageUpload
                      label="Imagen del Producto"
                      value={formData.image_url}
                      onChange={(url) => {
                        setFormData({ ...formData, image_url: url });
                        // Auto-generar thumbnail (mismo URL con transformación)
                        if (url) {
                          const thumbnailUrl = url.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto,f_auto/');
                          setFormData(prev => ({ ...prev, thumbnail_url: thumbnailUrl }));
                        }
                      }}
                      onRemove={() => {
                        setFormData({ ...formData, image_url: "", thumbnail_url: "" });
                      }}
                      folder="products"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProduct} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : editingProduct ? (
                      "Guardar cambios"
                    ) : (
                      "Crear producto"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs por categoría */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(
              (cat) => (
                console.log(cat.name),
                (
                  <TabsTrigger key={cat.category_id} value={cat.category_id}>
                    {cat.name + " " + cat.icon_url}
                  </TabsTrigger>
                )
              )
            )}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <Card key={product.product_id} className="flex flex-col">
                  {/* Imagen del producto */}
                  {(product.thumbnail_url || product.image_url) && (
                    <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={product.thumbnail_url || product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">
                        {product.category_name || "Sin categoría"}
                      </Badge>
                      {product.stock_quantity < 10 && (
                        <Badge
                          variant={
                            product.stock_quantity < 5
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          Stock: {product.stock_quantity}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-1">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(parseFloat(product.price))}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteProduct(product.product_id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {product.stock_quantity === 0 ? "Agotado" : "Agregar"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No se encontraron productos
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
