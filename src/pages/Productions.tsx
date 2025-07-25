import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, CalendarIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";

const token = localStorage.getItem("dairy_token");
const apiUrl = import.meta.env.VITE_API_URL;

const initialForm = {
  id: "",
  date: new Date(),
  milk_used_ltr: "",
  sepration_milk_ltr: "",
  whole_milk_ltr: "",
  products: [],
};

export default function Productions() {
  const [productions, setProductions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/productions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductions(res.data);
    } catch (err) {
      console.error("Failed to fetch productions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductsList(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  useEffect(() => {
    fetchProductions();
    fetchProducts();
  }, []);

  const handleProductChange = (id: string, quantity: string) => {
    const updated = form.products.map((p) =>
      p.product_id === id ? { ...p, quantity } : p
    );
    setForm({ ...form, products: updated });
  };

  const toggleProduct = (id: string) => {
    const exists = form.products.find((p) => p.product_id === id);
    if (exists) {
      setForm({
        ...form,
        products: form.products.filter((p) => p.product_id !== id),
      });
    } else {
      setForm({
        ...form,
        products: [...form.products, { product_id: id, quantity: "" }],
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = {
      date: format(form.date, "yyyy-MM-dd"),
      milk_used_ltr: form.milk_used_ltr,
      sepration_milk_ltr: form.sepration_milk_ltr,
      whole_milk_ltr: form.whole_milk_ltr,
      products: form.products,
    };

    try {
      if (editMode && form.id) {
        await axios.put(`${apiUrl}/productions/${form.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${apiUrl}/productions`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      fetchProductions();
      setForm(initialForm);
      setOpen(false);
      setEditMode(false);
    } catch (err) {
      console.error("Failed to submit production", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setForm({ ...item, date: new Date(item.date) });
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`${apiUrl}/productions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProductions();
    } catch (err) {
      console.error("Failed to delete production", err);
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Productions</h1>
          <p className="text-sm text-muted-foreground">
            Track dairy production processes
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(initialForm);
            setEditMode(false);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Production
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Production Records</CardTitle>
          <CardDescription>
            Monitor milk-to-product transformation processes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : productions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No production entries found.
            </div>
          ) : (
            productions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-5 py-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-base text-foreground">
                    {format(new Date(item.date), "PPP")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Milk:{" "}
                    <span className="font-medium">{item.milk_used_ltr}L</span>{" "}
                    &bull; Skim Milk:{" "}
                    <span className="font-medium">
                      {item.sepration_milk_ltr}L
                    </span>{" "}
                    &bull; Whole Milk:{" "}
                    <span className="font-medium">{item.whole_milk_ltr}L</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
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

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Production" : "Add Production"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(form.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(date) =>
                      setForm({ ...form, date: date ?? new Date() })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Milk Used (L)</Label>
              <Input
                value={form.milk_used_ltr}
                onChange={(e) =>
                  setForm({ ...form, milk_used_ltr: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Skim Milk (L)</Label>
              <Input
                value={form.sepration_milk_ltr}
                onChange={(e) =>
                  setForm({ ...form, sepration_milk_ltr: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Whole Milk (L)</Label>
              <Input
                value={form.whole_milk_ltr}
                onChange={(e) =>
                  setForm({ ...form, whole_milk_ltr: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Products</Label>
              <div className="space-y-2">
                {productsList.map((prod) => {
                  const selected = form.products.find(
                    (p) => p.product_id === prod.id
                  );
                  return (
                    <div
                      key={prod.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleProduct(prod.id)}
                      />
                      <span className="w-32">{prod.name}</span>
                      {selected && (
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={selected.quantity}
                          onChange={(e) =>
                            handleProductChange(prod.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editMode ? "Update" : "Add"} Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
