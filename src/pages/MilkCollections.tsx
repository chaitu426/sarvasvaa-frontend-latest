
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
import {
  Input
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Pencil, ChevronRight, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// ... (imports remain unchanged)
import { Loader2 } from "lucide-react";

export default function MilkCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);


  const [form, setForm] = useState<Omit<Collection, "id">>({
    date: new Date().toISOString().split("T")[0],
    collection_time: "",
    quantity_ltr: "",
    cost_per_litre: "",
    milk_type: "cow",
    fat: "",
    snf: "",
  });

  type Collection = {
    id: string;
    date: string;
    collection_time: string;
    quantity_ltr: string;
    cost_per_litre: string;
    milk_type: "cow" | "buffalo";
    fat: string;
    snf: string;
  };

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/milk-collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollections(res.data);
    } catch (err) {
      console.error("Fetch error", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

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

      setForm({
        date: new Date().toISOString().split("T")[0],
        collection_time: "",
        quantity_ltr: "",
        cost_per_litre: "",
        milk_type: "cow",
        fat: "",
        snf: "",
      });
      setEditing(null);
      setOpenDialog(false);
      fetchCollections();
    } catch (err) {
      console.error("Submit error", err);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`${apiUrl}/milk-collections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCollections();
    } catch (err) {
      console.error("Delete error", err);
    }
    setDeletingId(null);
  };

  const openEditDialog = (item: Collection) => {
    setForm({ ...item });
    setEditing(item);
    setOpenDialog(true);
  };

  const groupedCollections = collections.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, Collection[]>);


  const toggleDateExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };


  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Milk Collections</h1>
          <p className="text-muted-foreground text-sm">Manage daily milk collection data</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              Add Collection
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
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="text-left font-normal">
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
                          setOpen(false); // 👈 close the popover
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>collection Time</Label>
                  <Select
                    value={form.collection_time}
                    onValueChange={(value: "cow" | "buffalo") =>
                      setForm({ ...form, collection_time: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Collection time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity (ltr)</Label>
                  <Input
                    value={form.quantity_ltr}
                    type="number"
                    onChange={(e) => setForm({ ...form, quantity_ltr: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Cost per Litre</Label>
                  <Input
                    value={form.cost_per_litre}
                    type="number"
                    onChange={(e) => setForm({ ...form, cost_per_litre: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Milk Type</Label>
                  <Select
                    value={form.milk_type}
                    onValueChange={(value: "cow" | "buffalo") =>
                      setForm({ ...form, milk_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milk type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cow">Cow</SelectItem>
                      <SelectItem value="buffalo">Buffalo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>FAT (%)</Label>
                  <Input
                    value={form.fat}
                    type="number"
                    onChange={(e) => setForm({ ...form, fat: e.target.value })}
                  />
                </div>

                <div>
                  <Label>SNF (%)</Label>
                  <Input
                    value={form.snf}
                    type="number"
                    onChange={(e) => setForm({ ...form, snf: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Update" : "Add"} Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milk Collection Records</CardTitle>
          <CardDescription>Overview of all entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedCollections).map(([date, entries]) => (
                <div key={date} className="border rounded-lg overflow-hidden">
                  {/* Date Header */}
                  <div
                    className="flex justify-between items-center px-4 py-3 cursor-pointer bg-muted hover:bg-muted/80 transition"
                    onClick={() => toggleDateExpand(date)}
                  >
                    <div className="font-semibold text-sm text-foreground">{date}</div>
                    <div className="text-muted-foreground text-xs">
                      {expandedDates.includes(date) ? <ChevronDown className="w-4 h-4" />: <ChevronRight className="w-4 h-4" />} 
                    </div>
                  </div>

                  {/* Entries under each date */}
                  {expandedDates.includes(date) && (
                    <div className="space-y-2 p-4">
                      {entries.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border border-border bg-background px-4 py-3 rounded-md shadow-sm hover:shadow transition"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {item.collection_time.toUpperCase()} – {item.quantity_ltr} L – ₹
                              {item.cost_per_litre}/L –{" "}
                              <span className="uppercase">{item.milk_type}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Fat: {item.fat}%, SNF: {item.snf}%
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10"
                              onClick={() => openEditDialog(item)}
                            >
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
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>


          )}
        </CardContent>
      </Card>
    </div>
  );
}
