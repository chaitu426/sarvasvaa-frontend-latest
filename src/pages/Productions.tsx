
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [selectedDate, setSelectedDate] = useState<string>("");




  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/productions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductions(res.data);

      // Group by date
      const grouped = res.data.reduce((acc, prod) => {
        const dateKey = format(new Date(prod.date), "yyyy-MM-dd");

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(prod);

        return acc;
      }, {});

      setGroupedProductions(grouped);
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
        <CardContent className=" space-y-6 p-0">
          {/* Calendar View */}
          {loading ? (
            <CalendarGridSkeleton />
          ) : (
            <CalendarGrid
              groupedCollections={groupedProductions}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}

          {/* Day Records Below Calendar */}
          {!loading &&
            selectedDate &&
            groupedProductions[selectedDate] &&
            (
              <div className="space-y-4 p-4 mt-4 rounded-xl bg-card shadow-sm">
                <h2 className="text-xl font-semibold">
                  Records for {format(new Date(selectedDate), "dd MMM yyyy")}
                </h2>

                {groupedProductions[selectedDate].map((item) => (
                  <RecordItem
                    key={item.id}
                    item={item}
                    onDelete={() => handleDelete(item.id)}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            )
          }
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
    </div>
  );

}

function RecordItem({
  item,
  onDelete,
  deleting,
}: {
  item: any;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [selectedProduction, setSelectedProduction] = useState<any>(null);

  const openDetailsDialog = async (id: string) => {
    try {
      const res = await axios.get(`${apiUrl}/productions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedProduction(res.data);
    } catch (err) {
      console.error("Failed to fetch production details", err);
    }
  };

  return (
    <Collapsible className="rounded-xl border border-border bg-card shadow-sm transition-all duration-200">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4">
        <CollapsibleTrigger
          onClick={() => openDetailsDialog(item.id)}
          className="flex flex-col text-left w-full cursor-pointer"
        >
          <p className="text-base font-semibold text-foreground">
            Batch No: {item.batch_no}
          </p>

          <p className="text-sm text-muted-foreground">
            Milk Used: <span className="font-medium">{new Intl.NumberFormat("en-IN").format(Number(item.milk_used_ltr))} L</span>
          </p>
        </CollapsibleTrigger>

        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-destructive/10 rounded-full transition"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
          ) : (
            <Trash className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </div>

      {/* DROPDOWN CONTENT */}
      <CollapsibleContent className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">

        {!selectedProduction && (
          <p className="text-center text-muted-foreground text-xs">Loading...</p>
        )}

        {selectedProduction && (
          <>
            {/* Milk details */}
            <div className="flex justify-between">
              <span>Skim Milk:</span>
              <span className="font-medium">
              {new Intl.NumberFormat("en-IN").format(Number(selectedProduction.sepration_milk_ltr))} L
              </span>
            </div>

            <div className="flex justify-between">
              <span>Whole Milk:</span>
              <span className="font-medium">
              {new Intl.NumberFormat("en-IN").format(Number(selectedProduction.whole_milk_ltr))} L
              </span>
            </div>

            {/* Products */}
            <div className="pt-2">
  <h3 className="font-medium text-foreground mb-2">Products</h3>

  <table className="w-full border border-border rounded-lg">
    <thead>
      <tr className="bg-muted">
        <th className="text-left p-2 border-b border-border">Product</th>
        <th className="text-left p-2 border-b border-border">Quantity</th>
        <th className="text-left p-2 border-b border-border">Raw Materials</th>
      </tr>
    </thead>

    <tbody>
      {selectedProduction.products?.map((p: any) => (
        <tr key={p.product_id} className="border-b border-border">
          {/* Product Name */}
          <td className="p-2">{p.product_name}</td>

          {/* Quantity */}
          <td className="p-2">
          {new Intl.NumberFormat("en-IN").format(Number(p.quantity))} {p.unit}
          </td>

          {/* Raw Materials */}
          <td className="p-2">
            {p.rawMaterials?.length > 0 ? (
              <ul className="list-disc ml-4 space-y-1">
                {p.rawMaterials.map((rm: any) => (
                  <li key={rm.raw_material_id}>{rm.name}</li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground">No materials</span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}



function CalendarGrid({
  groupedCollections,
  selectedDate,
  setSelectedDate,
}: {
  groupedCollections: Record<string, any>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const daysInMonth = monthEnd.getDate();
  const days = [...Array(daysInMonth)].map((_, i) => i + 1);

  return (
    <Card className="p-1 shadow-md bg-zinc-100">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <Button size="icon" variant="ghost" onClick={() =>
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
        }>
          &lt;
        </Button>

        <h2 className="text-base sm:text-lg font-semibold tracking-wide">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <Button size="icon" variant="ghost" onClick={() =>
          setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
        }>
          &gt;
        </Button>
      </div>

      {/* WEEKDAYS */}
      <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-[4px] sm:gap-2">
        {/* OFFSET */}
        {[...Array(monthStart.getDay())].map((_, i) => (
          <div key={i}></div>
        ))}

        {days.map((day) => {
          const dateKey = format(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
            "yyyy-MM-dd"
          );

          const entries = groupedCollections[dateKey] || [];

          const totalLitres = entries.reduce(
            (sum, p) => sum + Number(p.milk_used_ltr || 0),
            0
          );
          const isSelected = selectedDate === dateKey;
          const isToday = todayKey === dateKey;

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateKey)}
              className={`
                rounded-lg border p-1.5 sm:p-2
                h-[60px] sm:h-24
                flex flex-col justify-between
                cursor-pointer transition
                active:scale-[0.97]
                overflow-hidden
                ${isSelected ? "border-primary bg-primary/10 shadow" : "bg-card"}
                ${isToday ? "ring-1 ring-primary/40" : ""}
                ${entries.length > 0 ? "hover:border-primary/40" : "text-muted-foreground"}
              `}
            >
              {/* Top Row */}
              <div className="flex justify-between items-start">
                <span className="text-[11px] sm:text-sm font-semibold leading-none">
                  {day}
                </span>

                {isToday && (
                  <span className="text-[4px] sm:text-[6px] px-1 py-[1px] rounded bg-primary/20 text-primary font-medium leading-none">
                    Today
                  </span>
                )}
              </div>

              {/* Summary */}
              {entries.length > 0 ? (
                <div className="flex flex-col gap-[2px] mt-1 overflow-hidden">
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-xs font-medium text-primary leading-none truncate">
                      {Number(totalLitres.toFixed(2))} L used
                    </span>
                    <span className="px-1 rounded bg-yellow-500/20 text-yellow-600 text-[6px] sm:text-[8px] leading-none">
                      {entries.length} Batch{entries.length > 1 ? "es" : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[6px] sm:text-[8px] text-muted-foreground">
                  –
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}


function CalendarGridSkeleton() {
  return (
    <Card className="p-1 sm:p-4 shadow-md bg-zinc-100 animate-pulse">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-muted" />
        <div className="h-5 w-24 sm:w-32 bg-muted rounded" />
        <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-md bg-muted" />
      </div>

      {/* WEEKDAY NAMES */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-muted rounded" />
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-[4px] sm:gap-2">
        {/* 42 skeleton date cells (6 rows × 7 columns) */}
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="
              rounded-lg border p-1.5 sm:p-2
              h-[60px] sm:h-24
              bg-card flex flex-col justify-between
            "
          >
            <div className="flex justify-between">
              <div className="h-3 w-3 bg-muted rounded" />
              <div className="h-3 w-5 bg-muted rounded" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="h-2 w-10 bg-muted rounded" />
              <div className="flex gap-1">
                <div className="h-2 w-3 bg-muted rounded" />
                <div className="h-2 w-3 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}