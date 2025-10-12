
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
import { Plus, Pencil, Trash, CalendarIcon, Loader2, Factory } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const token = localStorage.getItem("dairy_token");
const apiUrl = import.meta.env.VITE_API_URL;



const initialForm = {
  id: "",
  date: new Date(),
  sepration_milk_ltr: "",
  whole_milk_ltr: "",
  milk_used_ltr: "",
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [groupedProductions, setGroupedProductions] = useState<Record<string, any[]>>({});
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);



  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/productions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductions(res.data);

      // Group by date
      const grouped = res.data.reduce((acc, prod) => {
        const date = prod.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(prod);
        return acc;
      }, {});
      setGroupedProductions(grouped);
    } catch (err) {
      console.error("Failed to fetch productions", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailsDialog = async (id: string) => {
    try {
      const res = await axios.get(`${apiUrl}/productions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedProduction(res.data);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error("Failed to fetch production details", err);
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
  }

  useEffect(() => {
    fetchProductions();
    fetchProducts();
  }, []);

  useEffect(() => {
    const skim = parseFloat(form.sepration_milk_ltr) || 0;
    const whole = parseFloat(form.whole_milk_ltr) || 0;
    const total = skim + whole;
    setForm((prev) => ({
      ...prev,
      milk_used_ltr: total.toFixed(2),
    }));
  }, [form.sepration_milk_ltr, form.whole_milk_ltr]);

  const handleProductQuantityChange = (product_id: string, quantity: string) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.product_id === product_id ? { ...p, quantity } : p
      ),
    }));
  };

  const handleProductSelect = (product_id: string) => {
    const exists = form.products.some((p) => p.product_id === product_id);
    if (!exists) {
      const selectedProduct = productsList.find((p) => p.id === product_id);

      // Initialize raw_materials with quantity_used = "" for input
      const rawMaterialsWithQuantity = selectedProduct?.rawMaterials?.map((rm) => ({
        raw_material_id: rm.id,
        name: rm.name,
        unit: rm.unit,
        quantity_used: "", // ✅ initialize as empty string
      })) || [];


      setForm((prev) => ({
        ...prev,
        products: [
          ...prev.products,
          {
            product_id,
            quantity: "",
            raw_materials: rawMaterialsWithQuantity,
          },
        ],
      }));
    }
  };



  const handleRawMaterialQuantityChange = (
    productIndex: number,
    rawMaterialIndex: number,
    quantityUsed: string
  ) => {
    const updatedProducts = [...form.products];
    updatedProducts[productIndex].raw_materials[rawMaterialIndex].quantity_used = quantityUsed;
    setForm({ ...form, products: updatedProducts });
  };

  const removeProduct = (product_id: string) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.product_id !== product_id),
    }));
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
    const transformedProducts = item.products.map((p) => ({
      product_id: p.product_id,
      quantity: p.quantity,
      raw_materials: p.rawMaterials?.map((rm) => ({
        raw_material_id: rm.raw_material_id,
        name: rm.name,
        unit: rm.unit,
        quantity_used: rm.quantity_used,
      })) || [],
    }));

    setForm({
      ...item,
      date: new Date(item.date),
      products: transformedProducts,
    });

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
        <CardContent className="space-y-4">
  {loading ? (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  ) : Object.keys(groupedProductions).length === 0 ? (
    <div className="text-center py-12 text-muted-foreground">
      No production entries found.
    </div>
  ) : (
    Object.entries(groupedProductions).map(([date, entries]) => {
      const formattedDate = format(new Date(date), "EEEE, dd MMM yyyy");

      // Optional summary (e.g., total batches per day)
      const totalBatches = entries.length;

      return (
        <div
          key={date}
          className="rounded-xl border border-border bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm transition hover:shadow-md hover:border-primary/40"
        >
          {/* Header */}
          <button
            onClick={() =>
              setExpandedDates((prev) =>
                prev.includes(date)
                  ? prev.filter((d) => d !== date)
                  : [...prev, date]
              )
            }
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 border-b border-border/60 rounded-md bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all"
            )}
          >
            <div className="flex flex-col gap-0.5 text-left">
              <p className="font-semibold text-md text-foreground flex items-center gap-2">
                <Factory className="w-4 h-4 text-primary" />
                {formattedDate}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalBatches} Batch{totalBatches > 1 && "es"} recorded
              </p>
            </div>
            <div className="text-muted-foreground text-xs">
              {expandedDates.includes(date) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Records */}
          {expandedDates.includes(date) && (
            <div className="p-4 space-y-3 bg-background/60">
              {(entries as any[]).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-5 py-4 shadow-sm hover:shadow-md transition"
                >
                  <div
                    className="space-y-1 cursor-pointer"
                    onClick={() => openDetailsDialog(item.id)}
                  >
                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">BATCH NO:</span>
                      <span className="font-semibold text-primary">
                        {item.batch_no}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
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
              ))}
            </div>
          )}
        </div>
      );
    })
  )}
</CardContent>

      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Production" : "Add Production"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                    onSelect={(date) => {
                      if (date) {
                        setForm({ ...form, date });
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
              <Label>Milk Used (L)</Label>
              <Input readOnly value={form.milk_used_ltr} />
            </div>

            <div className="grid gap-2">
              <Label>Add Product</Label>
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {productsList.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              {form.products.map((prod) => {
                const product = productsList.find((p) => p.id === prod.product_id);
                return (
                  <div key={prod.product_id} className="p-2 border rounded-md space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-32 font-medium">{product?.name || "Unknown"}</span>
                        <Input
                          type="number"
                          placeholder="Product Quantity"
                          value={prod.quantity}
                          onChange={(e) =>
                            handleProductQuantityChange(prod.product_id, e.target.value)
                          }
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-destructive/10"
                        onClick={() => removeProduct(prod.product_id)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>


                    {/* Render raw materials */}
                    <div className="ml-4 space-y-2">
                      {prod.raw_materials?.map((rm, rmIdx) => (
                        <div key={rm.raw_material_id} className="flex items-center gap-2">
                          <span className="w-40 text-sm text-muted-foreground">
                            {rm.name} ({rm.unit})
                          </span>
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={rm.quantity_used}
                            onChange={(e) =>
                              handleRawMaterialQuantityChange(
                                form.products.findIndex((p) => p.product_id === prod.product_id),
                                rmIdx,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editMode ? "Update" : "Add"} Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl sm:max-w-md max-h-[80vh] overflow-y-auto border border-border shadow-xl bg-background">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-primary">Production Details</DialogTitle>
          </DialogHeader>

          {selectedProduction ? (
            <div className="space-y-4 text-sm text-foreground">
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{format(new Date(selectedProduction.date), "PPP")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Batch No:</span>
                <span>{selectedProduction.batch_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Milk Used:</span>
                <span>{selectedProduction.milk_used_ltr} L</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Skim Milk:</span>
                <span>{selectedProduction.sepration_milk_ltr} L</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Whole Milk:</span>
                <span>{selectedProduction.whole_milk_ltr} L</span>
              </div>

              <div className="space-y-4">
                <p className="font-medium">Products:</p>
                {selectedProduction.products.map((product) => (
                  <div key={product.product_id} className="ml-2 space-y-2">
                    <div className="text-muted-foreground">
                      <span className="text-foreground font-medium">{product.product_name || "Unnamed"}</span> — {product.quantity} {product.unit}
                    </div>
                    {product.rawMaterials && product.rawMaterials.length > 0 && (
                      <div className="ml-4">
                        <p className="text-sm font-medium mb-1 text-foreground">Raw Materials:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {product.rawMaterials.map((rm) => (
                            <li key={rm.raw_material_id}>{rm.name || "Unnamed"}  -  {rm.quantity_used} {rm.unit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
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
