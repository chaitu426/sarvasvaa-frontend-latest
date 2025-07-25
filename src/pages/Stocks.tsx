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

type StockItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: string;
  unit: string;
  status: "normal" | "low";
  last_updated: string;
};

export default function Stocks() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

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
      console.error("Failed to fetch stocks or products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  return (
    <div className="space-y-6 mt-10 sm:px-4 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl text-foreground">Stocks</h1>
        <p className="text-sm text-muted-foreground">
          View current inventory levels (read-only)
        </p>
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                    variant={
                      item.status === "low" ? "destructive" : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
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

      {/* Explanation Card */}
      <Card className="border border-border mt-4">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Stock Overview</CardTitle>
          <CardDescription className="text-sm">
            Automated inventory tracking based on productions and sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              Production entries add to stock
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              Sales reduce stock levels
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              Low stock alerts when threshold reached
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
