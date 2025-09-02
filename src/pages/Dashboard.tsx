"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Milk,
  Package,
  DollarSign,
  Truck,
  ClipboardList,
} from "lucide-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Number formatting utils
const formatNumber = (num: number, digits: number = 0) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);

const formatCurrency = (num: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);

export default function Dashboard() {
  const [collections, setCollections] = useState<any[]>([]);
  const [productions, setProductions] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("dairy_token") : null;
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [colRes, prodRes, saleRes, stockRes, prodMetaRes] = await Promise.all([
        axios.get(`${apiUrl}/milk-collections`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiUrl}/productions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiUrl}/sales`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiUrl}/stocks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${apiUrl}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCollections(
        (colRes.data ?? []).map((c: any) => ({
          date: c.date,
          quantity: Number(c.quantity_ltr) || 0,
        }))
      );

      const flatProds = (prodRes.data ?? []).flatMap((p: any) =>
        (p.products ?? []).map((prod: any) => ({
          id: `${p.date}-${prod.product_id}`,
          date: p.date,
          product: prod.product_name,
          quantity: Number(prod.quantity) || 0,
        }))
      );
      setProductions(flatProds);

      setSales(
        (saleRes.data ?? []).map((s: any) => ({
          id: s.id,
          date: s.date,
          customer: s.customer,
          total: Number(s.total) || 0,
        }))
      );

      const productsMap = (prodMetaRes.data ?? []).reduce(
        (map: any, product: any) => {
          map[product.id] = product;
          return map;
        },
        {}
      );

      setStocks(
        (stockRes.data ?? []).map((item: any) => {
          const product = productsMap[item.product_id];
          return {
            id: item.id,
            qty: Number(item.quantity) || 0,
            product_name: product?.name || "Unnamed Product",
            unit: product?.unit || "units",
            status: Number(item.quantity) < 20 ? "low" : "normal",
          };
        })
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [token]);

  // ✅ Aggregates
  const totalMilk = collections.reduce((sum, x) => sum + x.quantity, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProductions = new Set(productions.map((p) => p.id)).size;
  const stockCount = stocks.reduce((sum, s) => sum + s.qty, 0);

  // ✅ Sort by latest date
  const sortedProductions = [...productions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="min-h-screen mt-10 sm:p-6 bg-background text-foreground">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Snapshot of current dairy operations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAll}
          disabled={loading}
          className="text-sm"
        >
          <Truck className="w-4 h-4 mr-2" />{" "}
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border border-border shadow-sm p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </Card>
          ))
        ) : (
          <>
            <SummaryCard
              title="Total Milk Collected"
              value={`${formatNumber(totalMilk, 2)} L`}
              icon={<Milk className="w-4 h-4 text-primary" />}
            />
            <SummaryCard
              title="Total Productions"
              value={formatNumber(totalProductions)}
              icon={<ClipboardList className="w-4 h-4 text-primary" />}
            />
            <SummaryCard
              title="Total Sales"
              value={formatCurrency(totalSales)}
              icon={<DollarSign className="w-4 h-4 text-primary" />}
            />
            <SummaryCard
              title="Stock On Hand"
              value={`${formatNumber(stockCount, 2)} units`}
              icon={<Package className="w-4 h-4 text-primary" />}
            />
          </>
        )}
      </section>

      {/* Tables */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <Card
              key={i}
              className="rounded-xl border border-border bg-background/70 backdrop-blur shadow-md p-4"
            >
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-60 mb-4" />
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-6 w-full mb-2" />
              ))}
            </Card>
          ))
        ) : (
          <>
            <DataTable
              title="Recent Productions"
              description="Latest items manufactured"
              headers={["Date", "Product", "Quantity"]}
              rows={sortedProductions.slice(0, 5).map((p) => [
                new Date(p.date).toLocaleDateString(),
                p.product,
                formatNumber(p.quantity, 2),
              ])}
              badgeClass="bg-green-800 text-green-100"
            />

            <DataTable
              title="Recent Sales"
              description="Latest transactions"
              headers={["Date", "Customer", "Total"]}
              rows={sortedSales.slice(0, 5).map((s) => [
                new Date(s.date).toLocaleDateString(),
                s.customer,
                formatCurrency(s.total),
              ])}
              badgeClass="bg-blue-800 text-blue-100"
            />
          </>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: any;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-base sm:text-xl font-semibold text-foreground">
            {value}
          </CardDescription>
        </div>
        <div className="p-1 sm:p-2 bg-muted rounded-full">{icon}</div>
      </CardHeader>
    </Card>
  );
}

function DataTable({
  title,
  description,
  headers,
  rows,
  badgeClass,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: (string | number)[][];
  badgeClass: string;
}) {
  return (
    <Card className="rounded-xl border border-border bg-background/70 backdrop-blur shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-widest">
              {headers.map((h, i) => (
                <th key={i} className="text-left whitespace-nowrap px-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`rounded-lg ${
                  i % 2 === 0 ? "bg-muted/20" : ""
                } hover:bg-muted/40`}
              >
                {row.map((cell, j) => (
                  <td key={j} className="py-2 px-2 font-medium text-foreground">
                    {j === row.length - 1 ? (
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}
                      >
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
