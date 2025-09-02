"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
type StockItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: string;
  unit: string;
  status: "normal" | "low";
  last_updated: string;
};

type Product = {
  id: string;
  name: string;
  unit: string;
};

type Form = {
  product_id: string;
  action: "increase" | "decrease";
  amount: string;
};

const initialForm: Form = {
  product_id: "",
  action: "increase",
  amount: "",
};

export default function Stocks() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(initialForm);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch stocks + products
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const [stocksRes, productsRes] = await Promise.all([
        axios.get(`${apiUrl}/stocks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProductsList(productsRes.data);

      const productsMap = productsRes.data.reduce((map: any, product: any) => {
        map[product.id] = product;
        return map;
      }, {});

      const enrichedStocks = stocksRes.data.map((item: any) => {
        const product = productsMap[item.product_id];
        return {
          ...item,
          product_name: product?.name || "Unnamed Product",
          unit: product?.unit || "units",
          status: parseFloat(item.quantity) < 20 ? "low" : "normal",
        };
      });

      setStocks(enrichedStocks);
    } catch (err) {
      console.error("Failed to fetch stocks/products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Handle stock adjustment
  const handleAddStock = async () => {
    if (!form.product_id || !form.action || !form.amount) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${apiUrl}/stocks/addstock`,
        {
          product_id: form.product_id,
          action: form.action,
          amount: parseFloat(form.amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOpen(false);
      setForm(initialForm);
      fetchStocks();
    } catch (err) {
      console.error("Failed to update stock manually:", err);
      alert("Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl text-foreground">
            Stocks
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage inventory levels
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(initialForm);
            setOpen(true);
          }}
        >
          Adjust Stock
        </Button>
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse border border-border shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No stock records found.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((item) => (
            <Card
              key={item.id}
              className="transition-all hover:shadow-md border border-border"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg truncate">
                    {item.product_name}
                  </CardTitle>
                  <Badge
                    variant={item.status === "low" ? "destructive" : "secondary"}
                  >
                    {item.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Last updated:{" "}
                  {new Date(item.last_updated).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {item.quantity}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {item.unit}
                  </span>
                </div>
                {item.status === "low" && (
                  <p className="text-xs text-destructive mt-1">
                    Below minimum threshold
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setForm(initialForm);
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manually Adjust Stock</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select Product */}
            <div className="grid gap-2">
              <Label>Select Product</Label>
              <Select
                value={form.product_id}
                onValueChange={(val) => setForm({ ...form, product_id: val })}
              >
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

            {/* Action */}
            <div className="grid gap-2">
              <Label>Action</Label>
              <Select
                value={form.action}
                onValueChange={(val) =>
                  setForm({ ...form, action: val as "increase" | "decrease" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddStock} disabled={submitting}>
              {submitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Adjust Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
