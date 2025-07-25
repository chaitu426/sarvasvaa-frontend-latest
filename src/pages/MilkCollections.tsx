
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
import { Plus, Trash, Pencil } from "lucide-react";
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

  const [form, setForm] = useState<Omit<Collection, "id">>({
    date: new Date().toISOString().split("T")[0],
    source_name: "",
    quantity_ltr: "",
    cost_per_litre: "",
    milk_type: "cow",
    fat: "",
    snf: "",
  });

  type Collection = {
    id: string;
    date: string;
    source_name: string;
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
        source_name: "",
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
              <Plus className="mr-2 h-4 w-4" />
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="text-left font-normal">
                      {format(new Date(form.date), "yyyy-MM-dd")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(form.date)}
                      onSelect={(date) =>
                        setForm((prev) => ({
                          ...prev,
                          date: date?.toISOString().split("T")[0] || prev.date,
                        }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Source Name</Label>
                  <Input
                    value={form.source_name}
                    onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                  />
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
                  <Label>Fat (%)</Label>
                  <Input
                    value={form.fat}
                    type="number"
                    onChange={(e) => setForm({ ...form, fat: e.target.value })}
                  />
                </div>

                <div>
                  <Label>SNF</Label>
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
            <div className="space-y-3">
              {collections.map((item) => (
                <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-5 py-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="space-y-1 text-sm">
                  <h3 className="font-semibold text-lg text-foreground">{item.source_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.date} &bull; {item.quantity_ltr} L &bull;{" "}
                    <span className="uppercase">{item.milk_type}</span> &bull;{" "}
                    <span className="text-foreground font-medium">₹{item.cost_per_litre}/L</span>
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
        </CardContent>
      </Card>
    </div>
  );
}




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
// import { Plus, Trash, Pencil, Loader2 } from "lucide-react";
// import { Label } from "@/components/ui/label";
// import { useEffect, useState } from "react";
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
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// export default function MilkCollectionsPage() {
//   const [collections, setCollections] = useState<Collection[]>([]);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [editing, setEditing] = useState<Collection | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   const [form, setForm] = useState<Omit<Collection, "id">>({
//     date: new Date().toISOString().split("T")[0],
//     source_name: "",
//     quantity_ltr: "",
//     cost_per_litre: "",
//     milk_type: "cow",
//     fat: "",
//     snf: "",
//   });

//   type Collection = {
//     id: string;
//     date: string;
//     source_name: string;
//     quantity_ltr: string;
//     cost_per_litre: string;
//     milk_type: "cow" | "buffalo";
//     fat: string;
//     snf: string;
//   };

//   const token = localStorage.getItem("dairy_token");
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const fetchCollections = async () => {
//     setIsLoading(true);
//     try {
//       const res = await axios.get(`${apiUrl}/milk-collections`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setCollections(res.data);
//     } catch (err) {
//       console.error("Fetch error", err);
//     }
//     setIsLoading(false);
//   };

//   useEffect(() => {
//     fetchCollections();
//   }, []);

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

//       setForm({
//         date: new Date().toISOString().split("T")[0],
//         source_name: "",
//         quantity_ltr: "",
//         cost_per_litre: "",
//         milk_type: "cow",
//         fat: "",
//         snf: "",
//       });
//       setEditing(null);
//       setOpenDialog(false);
//       fetchCollections();
//     } catch (err) {
//       console.error("Submit error", err);
//     }
//     setIsSubmitting(false);
//   };

//   const handleDelete = async (id: string) => {
//     setDeletingId(id);
//     try {
//       await axios.delete(`${apiUrl}/milk-collections/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchCollections();
//     } catch (err) {
//       console.error("Delete error", err);
//     }
//     setDeletingId(null);
//   };

//   const openEditDialog = (item: Collection) => {
//     setForm({ ...item });
//     setEditing(item);
//     setOpenDialog(true);
//   };

//   return (
//     <div className="space-y-6 px-2 sm:px-4 md:px-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
//             Milk Collections
//           </h1>
//           <p className="text-muted-foreground text-sm">
//             Manage daily milk collection data
//           </p>
//         </div>
//         <Dialog open={openDialog} onOpenChange={setOpenDialog}>
//           <DialogTrigger asChild>
//             <Button size="sm">
//               <Plus className="mr-2 h-4 w-4" />
//               Add Collection
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-sm sm:max-w-md">
//             <DialogHeader>
//               <DialogTitle>{editing ? "Update" : "Add"} Collection</DialogTitle>
//             </DialogHeader>
//             <div className="grid gap-4">
//               {/* Date */}
//               <div className="flex flex-col gap-2">
//                 <Label>Date</Label>
//                 <Popover>
//                   <PopoverTrigger asChild>
//                     <Button variant="outline" className="text-left font-normal w-full">
//                       {format(new Date(form.date), "yyyy-MM-dd")}
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="p-0">
//                     <Calendar
//                       mode="single"
//                       selected={new Date(form.date)}
//                       onSelect={(date) =>
//                         setForm((prev) => ({
//                           ...prev,
//                           date: date?.toISOString().split("T")[0] || prev.date,
//                         }))
//                       }
//                     />
//                   </PopoverContent>
//                 </Popover>
//               </div>

//               <div className="grid sm:grid-cols-2 gap-4">
//                 <div>
//                   <Label>Source Name</Label>
//                   <Input
//                     value={form.source_name}
//                     onChange={(e) => setForm({ ...form, source_name: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <Label>Quantity (ltr)</Label>
//                   <Input
//                     value={form.quantity_ltr}
//                     type="number"
//                     onChange={(e) => setForm({ ...form, quantity_ltr: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <Label>Cost per Litre</Label>
//                   <Input
//                     value={form.cost_per_litre}
//                     type="number"
//                     onChange={(e) => setForm({ ...form, cost_per_litre: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <Label>Milk Type</Label>
//                   <Select
//                     value={form.milk_type}
//                     onValueChange={(value: "cow" | "buffalo") =>
//                       setForm({ ...form, milk_type: value })
//                     }
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select milk type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="cow">Cow</SelectItem>
//                       <SelectItem value="buffalo">Buffalo</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label>Fat (%)</Label>
//                   <Input
//                     value={form.fat}
//                     type="number"
//                     onChange={(e) => setForm({ ...form, fat: e.target.value })}
//                   />
//                 </div>

//                 <div>
//                   <Label>SNF</Label>
//                   <Input
//                     value={form.snf}
//                     type="number"
//                     onChange={(e) => setForm({ ...form, snf: e.target.value })}
//                   />
//                 </div>
//               </div>

//               <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
//                 {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
//                 {editing ? "Update" : "Add"} Collection
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="text-base sm:text-lg">Milk Collection Records</CardTitle>
//           <CardDescription>Overview of all entries</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="flex justify-center py-12">
//               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {collections.map((item) => (
//                 <div
//                   key={item.id}
//                   className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-4 shadow-sm transition-all hover:shadow-md"
//                 >
//                   <div className="space-y-1 text-sm">
//                     <h3 className="font-semibold text-lg text-foreground">
//                       {item.source_name}
//                     </h3>
//                     <p className="text-xs text-muted-foreground">
//                       {item.date} &bull; {item.quantity_ltr} L &bull;{" "}
//                       <span className="uppercase">{item.milk_type}</span> &bull;{" "}
//                       <span className="text-foreground font-medium">₹{item.cost_per_litre}/L</span>
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-2 self-end sm:self-auto">
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="hover:bg-primary/10"
//                       onClick={() => openEditDialog(item)}
//                     >
//                       <Pencil className="h-4 w-4 text-muted-foreground" />
//                     </Button>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="hover:bg-destructive/10"
//                       onClick={() => handleDelete(item.id)}
//                       disabled={deletingId === item.id}
//                     >
//                       {deletingId === item.id ? (
//                         <Loader2 className="h-4 w-4 animate-spin text-destructive" />
//                       ) : (
//                         <Trash className="h-4 w-4 text-destructive" />
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
