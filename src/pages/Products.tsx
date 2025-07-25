
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

  const token =localStorage.getItem("dairy_token");
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
          <Plus className="h-4 w-4 mr-2" />
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
      <div className="space-y-1">
        <p className="font-semibold text-base text-foreground">
          {product.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Unit: <span className="font-medium">{product.unit}</span>
        </p>
      </div>

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lassi"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                name="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g. ltr"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Update" : "Add"} Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Plus, Pencil, Trash, Loader2 } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import axios from "axios";

// const initialForm = {
//   id: "",
//   name: "",
//   unit: "ltr",
// };

// export default function Products() {
//   const [products, setProducts] = useState([]);
//   const [form, setForm] = useState(initialForm);
//   const [open, setOpen] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [deletingId, setDeletingId] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const token = localStorage.getItem("dairy_token");
//   const apiUrl = import.meta.env.VITE_API_URL;

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(`${apiUrl}/products`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setProducts(res.data);
//     } catch (err) {
//       console.error("Failed to fetch products", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     try {
//       if (editMode && form.id) {
//         await axios.put(`${apiUrl}/products/${form.id}`, form, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         await axios.post(`${apiUrl}/products`, form, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//       fetchProducts();
//       setForm(initialForm);
//       setEditMode(false);
//       setOpen(false);
//     } catch (err) {
//       console.error("Error submitting form", err);
//     }
//     setIsSubmitting(false);
//   };

//   const handleEdit = (item) => {
//     setForm(item);
//     setEditMode(true);
//     setOpen(true);
//   };

//   const handleDelete = async (id) => {
//     setDeletingId(id);
//     try {
//       await axios.delete(`${apiUrl}/products/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       fetchProducts();
//     } catch (err) {
//       console.error("Error deleting product", err);
//     }
//     setDeletingId(null);
//   };

//   return (
//     <div className="space-y-6 p-4 md:p-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground">Products</h1>
//           <p className="text-muted-foreground text-sm">Manage your dairy product catalog</p>
//         </div>
//         <Button
//           onClick={() => {
//             setForm(initialForm);
//             setOpen(true);
//             setEditMode(false);
//           }}
//         >
//           <Plus className="h-4 w-4 mr-2" /> Add Product
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">Product Catalog</CardTitle>
//           <CardDescription>View and manage all dairy products</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-3">
//           {loading ? (
//             <div className="flex justify-center py-12">
//               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
//             </div>
//           ) : products.length === 0 ? (
//             <div className="text-center py-12 text-muted-foreground">
//               No products available.
//             </div>
//           ) : (
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//               {products.map((product) => (
//                 <div
//                   key={product.id}
//                   className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-background p-4 shadow-sm hover:shadow-md transition-all"
//                 >
//                   <div>
//                     <p className="font-semibold text-base text-foreground">{product.name}</p>
//                     <p className="text-sm text-muted-foreground">
//                       Unit: <span className="font-medium">{product.unit}</span>
//                     </p>
//                   </div>
//                   <div className="flex gap-2 mt-2">
//                     <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
//                       <Pencil className="h-4 w-4 text-muted-foreground" />
//                     </Button>
//                     <Button
//                       size="icon"
//                       variant="ghost"
//                       className="hover:bg-destructive/10"
//                       onClick={() => handleDelete(product.id)}
//                       disabled={deletingId === product.id}
//                     >
//                       {deletingId === product.id ? (
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

//       <Dialog open={open} onOpenChange={(val) => {
//         setOpen(val);
//         if (!val) {
//           setForm(initialForm);
//           setEditMode(false);
//         }
//       }}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>{editMode ? "Edit Product" : "Add Product"}</DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4">
//             <div className="grid gap-2">
//               <Label htmlFor="name">Product Name</Label>
//               <Input
//                 id="name"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 placeholder="e.g. Lassi"
//               />
//             </div>

//             <div className="grid gap-2">
//               <Label htmlFor="unit">Unit</Label>
//               <Input
//                 id="unit"
//                 value={form.unit}
//                 onChange={(e) => setForm({ ...form, unit: e.target.value })}
//                 placeholder="e.g. ltr"
//               />
//             </div>
//           </div>

//           <DialogFooter className="mt-4">
//             <Button variant="outline" onClick={() => setOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} disabled={isSubmitting}>
//               {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
//               {editMode ? "Update" : "Add"} Product
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
