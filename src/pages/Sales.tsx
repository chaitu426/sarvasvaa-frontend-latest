"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
}

interface Sale {
  sale_id: string;
  date: string; // ISO string format
  customer: string;
  product_id: string;
  product_name?: string;
  quantity: string;
  rate: string;
  total: string;
  payment_status: "paid" | "unpaid";
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<Sale, "sale_id">>({
    date: new Date().toISOString().split("T")[0],
    customer: "",
    product_id: "",
    quantity: "",
    rate: "",
    total: "",
    payment_status: "unpaid",
  });

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      customer: "",
      product_id: "",
      quantity: "",
      rate: "",
      total: "",
      payment_status: "unpaid",
    });
    setEditing(null);
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load sales", variant: "destructive" });
      console.error("Error fetching sales:", error);
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
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`${apiUrl}/sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales((prev) => prev.filter((sale) => sale.sale_id !== id));
      toast({ title: "Deleted", description: "Sale removed successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete sale", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitSale = async () => {
    try {
      setIsSubmitting(true);
      if (editing) {
        await axios.put(`${apiUrl}/sales/${editing.sale_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Updated", description: "Sale updated successfully" });
      } else {
        await axios.post(`${apiUrl}/sales`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Created", description: "Sale added successfully" });
      }
      resetForm();
      setOpenDialog(false);
      fetchSales();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save sale", variant: "destructive" });
      console.error("Save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sale
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Sale" : "Add New Sale"}</DialogTitle>
              <DialogDescription>
                Enter the details of the sale. All fields are required.
              </DialogDescription>
            </DialogHeader>

            {/* Form */}
            <div className="grid gap-4 py-4">
              {/* Date */}
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      {formData.date || "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(formData.date)}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, date: format(date, "yyyy-MM-dd") })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Customer */}
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Input
                  placeholder="Enter customer name"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                />
              </div>

              {/* Product */}
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity & Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => {
                      const quantity = e.target.value;
                      const total = (
                        parseFloat(quantity || "0") * parseFloat(formData.rate || "0")
                      ).toFixed(2);
                      setFormData({ ...formData, quantity, total });
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => {
                      const rate = e.target.value;
                      const total = (
                        parseFloat(formData.quantity || "0") * parseFloat(rate || "0")
                      ).toFixed(2);
                      setFormData({ ...formData, rate, total });
                    }}
                  />
                </div>
              </div>

              {/* Total */}
              <div className="grid gap-2">
                <Label>Total</Label>
                <Input readOnly value={formData.total} />
              </div>

              {/* Payment status */}
              <div className="grid gap-2">
                <Label>Payment Status</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_status: value as "paid" | "unpaid" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitSale} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update Sale" : "Add Sale"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Records</CardTitle>
          <CardDescription>Track and manage all sales entries</CardDescription>
        </CardHeader>
        <CardContent>
  {loading ? (
    <div className="grid gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-muted/30 animate-pulse border border-border/40"
        />
      ))}
    </div>
  ) : sales.length === 0 ? (
    <div className="text-center py-12 text-muted-foreground text-sm">
      No sales records found.
    </div>
  ) : (
    <div className="space-y-4">
      {sales.map((sale) => (
        <div
          key={sale.sale_id}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background/70 to-muted/20 backdrop-blur-md shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300"
        >
          <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Section */}
            <div className="space-y-1.5 text-sm">
              <p className="text-base font-semibold text-foreground">
                {new Date(sale.date).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              <p className="text-muted-foreground">
                Customer:{" "}
                <span className="font-medium text-foreground">
                  {sale.customer}
                </span>
              </p>

              <p className="text-muted-foreground">
                Product:{" "}
                <span className="capitalize font-medium text-foreground">
                  {sale.product_name ?? "—"}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                <span>
                  Qty:{" "}
                  <span className="font-medium text-foreground">
                    {sale.quantity}
                  </span>
                </span>
                <span>•</span>
                <span>
                  Rate: ₹
                  <span className="font-medium text-foreground">
                    {Number(sale.rate).toLocaleString("en-IN")}
                  </span>
                </span>
                <span>•</span>
                <span>
                  Total: ₹
                  <span className="font-semibold text-blue-400">
                    {Number(sale.total).toLocaleString("en-IN")}
                  </span>
                </span>
              </div>

              <div className="pt-1">
                <span className="text-muted-foreground">Status: </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    sale.payment_status === "paid"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {sale.payment_status}
                </span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-blue-500/10 rounded-full"
                onClick={() => {
                  setEditing(sale);
                  setFormData({
                    date: sale.date,
                    customer: sale.customer,
                    product_id: sale.product_id,
                    quantity: sale.quantity,
                    rate: sale.rate,
                    total: sale.total,
                    payment_status: sale.payment_status,
                  });
                  setOpenDialog(true);
                }}
              >
                <Pencil className="h-4 w-4 text-blue-400" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-red-500/10 rounded-full"
                onClick={() => handleDeleteSale(sale.sale_id)}
                disabled={deletingId === sale.sale_id}
              >
                {deletingId === sale.sale_id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                ) : (
                  <Trash className="h-4 w-4 text-red-500" />
                )}
              </Button>
            </div>
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
