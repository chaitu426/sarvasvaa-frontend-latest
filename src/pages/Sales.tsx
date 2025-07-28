"use client";

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
import { Plus, Trash2, Pencil, Loader2, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
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

interface Product {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  date: string; // ISO string format
  customer: string;
  product_id: string;
  quantity: string;
  rate: string;
  total: string;
  payment_status: string;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Sale, "id">>({
    date: new Date().toISOString().split("T")[0],
    customer: "",
    product_id: "",
    quantity: "",
    rate: "",
    total: "",
    payment_status: "unpaid",
  });

  const token =localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${apiUrl}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    try {
      setDeletingId(id);
      await axios.delete(`${apiUrl}/sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales((prev) => prev.filter((sale) => sale.id !== id));
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
    setDeletingId(null);
  };

  const handleCreateSale = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(`${apiUrl}/sales`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({
        date: new Date().toISOString().split("T")[0],
        customer: "",
        product_id: "",
        quantity: "",
        rate: "",
        total: "",
        payment_status: "unpaid",
      });
      setOpenDialog(false);
      fetchSales();
    } catch (err) {
      console.error("Create failed:", err);
    }
    setIsSubmitting(false);
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

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground text-sm">
            Manage sales transactions and invoices
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sale
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Sale</DialogTitle>
              <DialogDescription>
                Enter the details of the sale. All fields are required.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
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
                        date && setFormData({
                          ...formData,
                          date: date.toISOString().split("T")[0],
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  placeholder="Enter customer name"
                  value={formData.customer}
                  onChange={(e) =>
                    setFormData({ ...formData, customer: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product_id: value })
                  }
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsList.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    placeholder="0"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => {
                      const quantity = e.target.value;
                      const total = (
                        parseFloat(quantity || "0") *
                        parseFloat(formData.rate || "0")
                      ).toFixed(2);
                      setFormData({ ...formData, quantity, total });
                    }}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    placeholder="0.00"
                    type="number"
                    value={formData.rate}
                    onChange={(e) => {
                      const rate = e.target.value;
                      const total = (
                        parseFloat(rate || "0") *
                        parseFloat(formData.quantity || "0")
                      ).toFixed(2);
                      setFormData({ ...formData, rate, total });
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Total</Label>
                <Input readOnly value={formData.total} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_status: value })
                  }
                >
                  <SelectTrigger id="payment_status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSale} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>Track and manage all sales entries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sales records found.
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-border bg-background px-5 py-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-1 text-sm">
                    <p className="text-base font-semibold text-foreground">
                      {new Date(sale.date).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">
                      Customer: <span className="font-medium">{sale.customer}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Product: <span className="capitalize font-medium">{sale.product_id}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Qty: <span className="font-medium">{sale.quantity}</span> &bull; Rate: ₹
                      <span className="font-medium">{sale.rate}</span> &bull; Total: ₹
                      <span className="font-medium">{sale.total}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Status: <span className="capitalize font-medium">{sale.payment_status}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-destructive/10"
                      onClick={() => deleteSale(sale.id)}
                      disabled={deletingId === sale.id}
                    >
                      {deletingId === sale.id ? (
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
