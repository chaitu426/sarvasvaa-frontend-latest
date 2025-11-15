"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash,
  Pencil,
  ChevronRight,
  ChevronDown,
  Droplets,
  Loader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";


type Collection = {
  id: string;
  date: string;
  collection_time: "morning" | "night";
  quantity_ltr: string;
  cost_per_litre: string;
  milk_type: "cow" | "buffalo";
  fat: string;
  snf: string;
};

export default function MilkCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null)

  const [form, setForm] = useState<Omit<Collection, "id">>({
    date: new Date().toISOString().split("T")[0],
    collection_time: "morning",
    quantity_ltr: "",
    cost_per_litre: "",
    milk_type: "cow",
    fat: "",
    snf: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("dairy_token") : null;
  const apiUrl = import.meta.env.VITE_API_URL;

  /** 🔹 API Calls */
  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/milk-collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollections(res.data ?? []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await axios.put(`${apiUrl}/milk-collections/${editing.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${apiUrl}/milk-collections`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      resetForm();
      await fetchCollections();
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`${apiUrl}/milk-collections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setDeletingId(null);
    }
  };

  /** 🔹 Helpers */
  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      collection_time: "morning",
      quantity_ltr: "",
      cost_per_litre: "",
      milk_type: "cow",
      fat: "",
      snf: "",
    });
    setEditing(null);
    setOpenDialog(false);
  };

  const openEditDialog = (item: Collection) => {
    setForm({ ...item });
    setEditing(item);
    setOpenDialog(true);
  };

  const toggleDateExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  /** 🔹 Memoized Grouped Data */
  const groupedCollections = useMemo(() => {
    return collections.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, Collection[]>);
  }, [collections]);

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="space-y-6 mt-10 sm:px-2 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Milk Collections
          </h1>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Update" : "Add"} Collection</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              {/* Date */}
              <div className="flex flex-col gap-2">
                <Label>Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-left font-normal"
                    >
                      {format(new Date(form.date), "yyyy-MM-dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(form.date)}
                      onSelect={(date) => {
                        if (date) {
                          setForm((prev) => ({
                            ...prev,
                            date: format(date, "yyyy-MM-dd"),
                          }));
                          setDatePickerOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Collection Time"
                  type="select"
                  value={form.collection_time}
                  onChange={(val) =>
                    setForm({ ...form, collection_time: val as any })
                  }
                  options={[
                    { value: "morning", label: "Morning" },
                    { value: "night", label: "Night" },
                  ]}
                />
                <FormField
                  label="Quantity (ltr)"
                  type="number"
                  value={form.quantity_ltr}
                  onChange={(val) =>
                    setForm({ ...form, quantity_ltr: val as string })
                  }
                />
                <FormField
                  label="Cost per Litre"
                  type="number"
                  value={form.cost_per_litre}
                  onChange={(val) =>
                    setForm({ ...form, cost_per_litre: val as string })
                  }
                />
                <FormField
                  label="Milk Type"
                  type="select"
                  value={form.milk_type}
                  onChange={(val) =>
                    setForm({ ...form, milk_type: val as any })
                  }
                  options={[
                    { value: "cow", label: "Cow" },
                    { value: "buffalo", label: "Buffalo" },
                  ]}
                />
                <FormField
                  label="FAT (%)"
                  type="number"
                  value={form.fat}
                  onChange={(val) => setForm({ ...form, fat: val as string })}
                />
                <FormField
                  label="SNF (%)"
                  type="number"
                  value={form.snf}
                  onChange={(val) => setForm({ ...form, snf: val as string })}
                />
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editing ? "Update" : "Add"} Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Milk Collection Records</CardTitle>
          <CardDescription>Track collections effortlessly</CardDescription>
        </CardHeader>
        {isLoading ? 
          <CalendarGridSkeleton/>:
        <CalendarGrid
        groupedCollections={groupedCollections}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
          }
      {selectedDate && groupedCollections[selectedDate] && (
        <div className="space-y-4 p-4 mt-4">
          <h2 className="text-xl font-semibold">
            Records for {format(new Date(selectedDate), "dd MMM yyyy")}
          </h2>
          {groupedCollections[selectedDate].map((item) => (
            <RecordItem
              key={item.id}
              item={item}
              onEdit={() => openEditDialog(item)}
              onDelete={() => handleDelete(item.id)}
              deleting={deletingId === item.id}
            />
          ))}
        </div>
      )}
      </Card>
    </div>
  );
}

/** 🔹 Reusable FormField Component */
function FormField({
  label,
  type,
  value,
  onChange,
  options,
}: {
  label: string;
  type: "number" | "select";
  value: any;
  onChange: (val: string) => void;
  options?: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      {type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/** 🔹 Record Item Component */
function RecordItem({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: Collection;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-background/70 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="space-y-1 cursor-pointer">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`px-2 py-0.5 rounded-full font-medium text-md ${item.collection_time.includes("morning")
                ? "bg-yellow-500/15 text-yellow-500"
                : "bg-blue-500/15 text-blue-400"
              }`}
          >
            {item.collection_time}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">
            {item.milk_type}
          </span>
        </div>
        <p className="font-semibold text-base text-foreground mt-1">
          {new Intl.NumberFormat("en-IN").format(Number(item.quantity_ltr))} L • ₹
          {new Intl.NumberFormat("en-IN").format(Number(item.cost_per_litre))}/L
        </p>
        <p className="text-sm text-muted-foreground">
          Fat: <span className="font-medium">{item.fat}%</span> • SNF:{" "}
          <span className="font-medium">{item.snf}%</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-primary/10 rounded-full transition"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4 text-blue-400" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-destructive/10 rounded-full transition"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
          ) : (
            <Trash className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </div>
    </div>

  );
}

function CalendarGrid({
  groupedCollections,
  selectedDate,
  setSelectedDate,
}: {
  groupedCollections: Record<string, Collection[]>;
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
    <Card className="p-1 sm:p-4 shadow-md bg-zinc-100">
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
            (sum, e) => sum + Number(e.quantity_ltr || 0),
            0
          );
          const totalAmount = entries.reduce(
            (sum, e) =>
              sum +
              Number(e.quantity_ltr || 0) * Number(e.cost_per_litre || 0),
            0
          );

          const morning = entries.some((e) => e.collection_time === "morning");
          const night = entries.some((e) => e.collection_time === "night");

          const isSelected = selectedDate === dateKey;
          const isToday = todayKey === dateKey;

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(dateKey)}
              className={`
                rounded-md border p-1.5 sm:p-2
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
                  <span className="text-[9px] sm:text-xs font-medium text-primary leading-none truncate">
                    {Number(totalLitres.toFixed(2))} L • ₹{Number(totalAmount.toFixed(2))}
                  </span>

                  <div className="flex gap-[3px]">
                    {morning && (
                      <span className="px-1 rounded bg-yellow-500/20 text-yellow-600 text-[8px] sm:text-[9px] leading-none">
                        M
                      </span>
                    )}
                    {night && (
                      <span className="px-1 rounded bg-blue-500/20 text-blue-500 text-[8px] sm:text-[9px] leading-none">
                        N
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[9px] sm:text-[10px] text-muted-foreground">
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
















//old code 
// "use client";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Plus,
//   Trash,
//   Pencil,
//   ChevronRight,
//   ChevronDown,
//   Droplets ,
//   Loader2,
// } from "lucide-react";
// import { Label } from "@/components/ui/label";
// import { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { format } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Skeleton } from "@/components/ui/skeleton";


// type Collection = {
//   id: string;
//   date: string;
//   collection_time: "morning" | "night";
//   quantity_ltr: string;
//   cost_per_litre: string;
//   milk_type: "cow" | "buffalo";
//   fat: string;
//   snf: string;
// };

// export default function MilkCollectionsPage() {
//   const [collections, setCollections] = useState<Collection[]>([]);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [editing, setEditing] = useState<Collection | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [expandedDates, setExpandedDates] = useState<string[]>([]);
//   const [datePickerOpen, setDatePickerOpen] = useState(false);

//   const [form, setForm] = useState<Omit<Collection, "id">>({
//     date: new Date().toISOString().split("T")[0],
//     collection_time: "morning",
//     quantity_ltr: "",
//     cost_per_litre: "",
//     milk_type: "cow",
//     fat: "",
//     snf: "",
//   });

//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("dairy_token") : null;
//   const apiUrl = import.meta.env.VITE_API_URL;

//   /** 🔹 API Calls */
//   const fetchCollections = async () => {
//     setIsLoading(true);
//     try {
//       const res = await axios.get(`${apiUrl}/milk-collections`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCollections(res.data ?? []);
//     } catch (err) {
//       console.error("Fetch error", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     try {
//       if (editing) {
//         await axios.put(`${apiUrl}/milk-collections/${editing.id}`, form, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         await axios.post(`${apiUrl}/milk-collections`, form, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }

//       resetForm();
//       await fetchCollections();
//     } catch (err) {
//       console.error("Submit error", err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await axios.delete(`${apiUrl}/milk-collections/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCollections((prev) => prev.filter((c) => c.id !== id));
//     } catch (err) {
//       console.error("Delete error", err);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   /** 🔹 Helpers */
//   const resetForm = () => {
//     setForm({
//       date: new Date().toISOString().split("T")[0],
//       collection_time: "morning",
//       quantity_ltr: "",
//       cost_per_litre: "",
//       milk_type: "cow",
//       fat: "",
//       snf: "",
//     });
//     setEditing(null);
//     setOpenDialog(false);
//   };

//   const openEditDialog = (item: Collection) => {
//     setForm({ ...item });
//     setEditing(item);
//     setOpenDialog(true);
//   };

//   const toggleDateExpand = (date: string) => {
//     setExpandedDates((prev) =>
//       prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
//     );
//   };

//   /** 🔹 Memoized Grouped Data */
//   const groupedCollections = useMemo(() => {
//     return collections.reduce((acc, item) => {
//       if (!acc[item.date]) acc[item.date] = [];
//       acc[item.date].push(item);
//       return acc;
//     }, {} as Record<string, Collection[]>);
//   }, [collections]);

//   useEffect(() => {
//     fetchCollections();
//   }, []);

//   return (
//     <div className="space-y-6 mt-10 sm:px-4 md:px-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold text-foreground">
//             Milk Collections
//           </h1>
//         </div>
//         <Dialog open={openDialog} onOpenChange={setOpenDialog}>
//           <DialogTrigger asChild>
//             <Button>
//               <Plus className="w-4 h-4 mr-2" /> Add Collection
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{editing ? "Update" : "Add"} Collection</DialogTitle>
//             </DialogHeader>
//             <div className="grid gap-4">
//               {/* Date */}
//               <div className="flex flex-col gap-2">
//                 <Label>Date</Label>
//                 <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       className="text-left font-normal"
//                     >
//                       {format(new Date(form.date), "yyyy-MM-dd")}
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="p-0">
//                     <Calendar
//                       mode="single"
//                       selected={new Date(form.date)}
//                       onSelect={(date) => {
//                         if (date) {
//                           setForm((prev) => ({
//                             ...prev,
//                             date: format(date, "yyyy-MM-dd"),
//                           }));
//                           setDatePickerOpen(false);
//                         }
//                       }}
//                     />
//                   </PopoverContent>
//                 </Popover>
//               </div>

//               {/* Form Fields */}
//               <div className="grid grid-cols-2 gap-4">
//                 <FormField
//                   label="Collection Time"
//                   type="select"
//                   value={form.collection_time}
//                   onChange={(val) =>
//                     setForm({ ...form, collection_time: val as any })
//                   }
//                   options={[
//                     { value: "morning", label: "Morning" },
//                     { value: "night", label: "Night" },
//                   ]}
//                 />
//                 <FormField
//                   label="Quantity (ltr)"
//                   type="number"
//                   value={form.quantity_ltr}
//                   onChange={(val) =>
//                     setForm({ ...form, quantity_ltr: val as string })
//                   }
//                 />
//                 <FormField
//                   label="Cost per Litre"
//                   type="number"
//                   value={form.cost_per_litre}
//                   onChange={(val) =>
//                     setForm({ ...form, cost_per_litre: val as string })
//                   }
//                 />
//                 <FormField
//                   label="Milk Type"
//                   type="select"
//                   value={form.milk_type}
//                   onChange={(val) =>
//                     setForm({ ...form, milk_type: val as any })
//                   }
//                   options={[
//                     { value: "cow", label: "Cow" },
//                     { value: "buffalo", label: "Buffalo" },
//                   ]}
//                 />
//                 <FormField
//                   label="FAT (%)"
//                   type="number"
//                   value={form.fat}
//                   onChange={(val) => setForm({ ...form, fat: val as string })}
//                 />
//                 <FormField
//                   label="SNF (%)"
//                   type="number"
//                   value={form.snf}
//                   onChange={(val) => setForm({ ...form, snf: val as string })}
//                 />
//               </div>

//               <Button onClick={handleSubmit} disabled={isSubmitting}>
//                 {isSubmitting && (
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                 )}
//                 {editing ? "Update" : "Add"} Collection
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Records */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">Milk Collection Records</CardTitle>
//           <CardDescription>Track collections effortlessly</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="space-y-4">
//               {[...Array(6)].map((_, i) => (
//                 <Skeleton key={i} className="h-10 w-full rounded-md" />
//               ))}
//             </div>
//           ) : collections.length === 0 ? (
//             <p className="text-muted-foreground text-sm py-6 text-center">
//               No records found.
//             </p>
//           ) : (
// <div className="space-y-4">
//   {Object.entries(groupedCollections).map(([date, entries]) => {
//     // Format date to "Monday, 12 May 2025"
//     const formattedDate = format(new Date(date), "EEEE, dd MMM yyyy");

//     // Compute totals
//     const totalLitres = entries.reduce((sum, e) => sum + Number(e.quantity_ltr || 0), 0);
//     const totalCost = entries.reduce(
//       (sum, e) => sum + Number(e.quantity_ltr || 0) * Number(e.cost_per_litre || 0),
//       0
//     );

//     return (
//       <div
//         key={date}
//         className="rounded-xl border border-border bg-card/50 shadow-sm overflow-hidden backdrop-blur-sm transition hover:shadow-md hover:border-primary/40"
//       >
//         {/* Header */}
//         <div
//           className="flex justify-between items-center px-4 py-3 cursor-pointer border-b border-border/60 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all"
//           onClick={() => toggleDateExpand(date)}
//         >
//           <div className="flex flex-col gap-0.5">
//             <p className="font-semibold text-sm text-foreground flex items-center gap-2">
//               <span className="text-primary text-base">📅</span>
//               {formattedDate}
//             </p>
//             <p className="text-xs text-muted-foreground flex items-center gap-2">
//               <Droplets className="w-3 h-3 text-blue-400" />
//               {new Intl.NumberFormat("en-IN").format(totalLitres)} L • ₹{" "}
//               {new Intl.NumberFormat("en-IN").format(totalCost)}
//             </p>
//           </div>

//           <div className="text-muted-foreground text-xs">
//             {expandedDates.includes(date) ? (
//               <ChevronDown className="w-4 h-4" />
//             ) : (
//               <ChevronRight className="w-4 h-4" />
//             )}
//           </div>
//         </div>

//         {/* Records */}
//         {expandedDates.includes(date) && (
//           <div className="p-4 space-y-3 bg-background/60">
//             {entries.map((item) => (
//               <RecordItem
//                 key={item.id}
//                 item={item}
//                 onEdit={() => openEditDialog(item)}
//                 onDelete={() => handleDelete(item.id)}
//                 deleting={deletingId === item.id}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   })}
// </div>

//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// /** 🔹 Reusable FormField Component */
// function FormField({
//   label,
//   type,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   type: "number" | "select";
//   value: any;
//   onChange: (val: string) => void;
//   options?: { value: string; label: string }[];
// }) {
//   return (
//     <div>
//       <Label>{label}</Label>
//       {type === "select" ? (
//         <Select value={value} onValueChange={onChange}>
//           <SelectTrigger>
//             <SelectValue placeholder={`Select ${label}`} />
//           </SelectTrigger>
//           <SelectContent>
//             {options?.map((opt) => (
//               <SelectItem key={opt.value} value={opt.value}>
//                 {opt.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       ) : (
//         <Input
//           type={type}
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//         />
//       )}
//     </div>
//   );
// }

// /** 🔹 Record Item Component */
// function RecordItem({
//   item,
//   onEdit,
//   onDelete,
//   deleting,
// }: {
//   item: Collection;
//   onEdit: () => void;
//   onDelete: () => void;
//   deleting: boolean;
// }) {
//   return (
// <div
//   className="flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-background/70 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200"
// >
//   <div className="space-y-1 cursor-pointer">
//   <div className="flex items-center gap-2 text-sm">
//     <span
//       className={`px-2 py-0.5 rounded-full font-medium text-md ${
//         item.collection_time.includes("morning")
//           ? "bg-yellow-500/15 text-yellow-500"
//           : "bg-blue-500/15 text-blue-400"
//       }`}
//     >
//       {item.collection_time}
//     </span>
//     <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-medium">
//       {item.milk_type}
//     </span>
//   </div>
//   <p className="font-semibold text-base text-foreground mt-1">
//     {new Intl.NumberFormat("en-IN").format(Number(item.quantity_ltr))} L • ₹
//     {new Intl.NumberFormat("en-IN").format(Number(item.cost_per_litre))}/L
//   </p>
//     <p className="text-sm text-muted-foreground">
//       Fat: <span className="font-medium">{item.fat}%</span> • SNF:{" "}
//       <span className="font-medium">{item.snf}%</span>
//     </p>
//   </div>

//   <div className="flex items-center gap-2">
//     <Button
//       size="icon"
//       variant="ghost"
//       className="hover:bg-primary/10 rounded-full transition"
//       onClick={onEdit}
//     >
//       <Pencil className="h-4 w-4 text-blue-400" />
//     </Button>

//     <Button
//       size="icon"
//       variant="ghost"
//       className="hover:bg-destructive/10 rounded-full transition"
//       onClick={onDelete}
//       disabled={deleting}
//     >
//       {deleting ? (
//         <Loader2 className="h-4 w-4 animate-spin text-destructive" />
//       ) : (
//         <Trash className="h-4 w-4 text-destructive" />
//       )}
//     </Button>
//   </div>
// </div>

//   );
// }