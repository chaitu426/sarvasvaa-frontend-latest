
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Trash, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

const initialForm = {
  id: "",
  name: "",
  unit: "ltr",
  raw_materials: []
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(null);

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editMode && form.id) {
        await axios.put(`${apiUrl}/products/${form.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${apiUrl}/products`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      fetchProducts();
      setForm(initialForm);
      setEditMode(false);
      setOpen(false);
    } catch (err) {
      console.error("Error submitting form", err);
    }
    setIsSubmitting(false);
  };

  const handleEdit = (item) => {
    setIsSubmitting(true);
    setForm(item);
    setEditMode(true);
    setOpen(true);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`${apiUrl}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product", err);
    }
    setDeletingId(null);
  };

  const openDetailsDialog = async (id: string) => {
    try {
      const res = await axios.get(`${apiUrl}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedProducts(res.data);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error("Failed to fetch production details", err);
    }
  };

  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6"> 
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm">
            Manage your dairy product catalog
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(initialForm);
            setOpen(true);
            setEditMode(false);
          }}
        >
          Add Product
        </Button>
      </div>

      {/* Product List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Catalog</CardTitle>
          <CardDescription>View and manage all dairy products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products available.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-5 py-4 shadow-sm hover:shadow-md transition-all"
                
              >
                <div className="space-y-1" onClick={() => openDetailsDialog(product.id)}>
                  <p className="font-semibold text-base text-foreground">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unit: <span className="font-medium">{product.unit}</span>
                  </p>
                </div>
               
                    {/* {product.rawMaterials.map((raw)=>(
                      <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{raw.name}{raw.unit}</span>
                    </p>
                    ))} */}
                


                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-destructive/10"
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                  >
                    {deletingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                    ) : (
                      <Trash className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>

            ))
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setForm(initialForm);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lassi"
              />
            </div>

            {/* Product Unit */}
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                name="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. ltr"
              />
            </div>

            {/* Raw Materials Section */}
            <div className="grid gap-2">
              <Label>Raw Materials</Label>
              {form.raw_materials?.map((rm, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Material Name"
                    value={rm.name}
                    onChange={(e) => {
                      const newRawMaterials = [...form.raw_materials];
                      newRawMaterials[index].name = e.target.value;
                      setForm({ ...form, raw_materials: newRawMaterials });
                    }}
                  />
                  <Input
                    className="w-24"
                    placeholder="Unit"
                    value={rm.unit}
                    onChange={(e) => {
                      const newRawMaterials = [...form.raw_materials];
                      newRawMaterials[index].unit = e.target.value;
                      setForm({ ...form, raw_materials: newRawMaterials });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = [...form.raw_materials];
                      updated.splice(index, 1);
                      setForm({ ...form, raw_materials: updated });
                    }}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    raw_materials: [
                      ...(form.raw_materials || []),
                      { name: "", unit: "" },
                    ],
                  })
                }
              >
                + Add Raw Material
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editMode ? "Update" : "Add"} Product
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
       <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
              <DialogContent className="sm:max-w-md rounded-xl border border-border shadow-xl bg-background sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-primary">Product Details</DialogTitle>
                </DialogHeader>
      
                {selectedProducts ? (
                  <div className="space-y-4 text-sm text-foreground">
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Product Name:</span>
                      <span>{selectedProducts.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Unit:</span>
                      <span>{selectedProducts.unit}</span>
                    </div>
      
                    <div>
                      <p className="font-medium mb-1">Raw Materials:</p>
                      <ul className="space-y-1 list-disc list-inside ml-2 text-muted-foreground">
                        {selectedProducts.rawMaterials.map((p) => (
                          <li key={p.product_id} className="pl-1">
                            <span className="text-foreground">{p.name || "Unnamed"}</span> — {p.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Loading production details...</div>
                )}
              </DialogContent>
            </Dialog>
    </div>
  );
}
