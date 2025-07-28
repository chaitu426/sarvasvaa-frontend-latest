"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Milk,
  Package,
  DollarSign,
  Truck,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

export default function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [productions, setProductions] = useState([]);
  const [sales, setSales] = useState([]);
  const [stocks, setStocks] = useState([]);

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function fetchAll() {
      try {
        const [colRes, prodRes, saleRes, stockRes, products] = await Promise.all([
          fetch(`${apiUrl}/milk-collections`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/productions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/stocks`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/products`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const collectionsData = await colRes.json();
        const productionsData = await prodRes.json();
        const salesData = await saleRes.json();
        const stocksData = await stockRes.json();

        setCollections(
          (collectionsData || []).map((c) => ({
            date: c.date,
            quantity: Number(c.quantity_ltr) || 0,
          }))
        );

        const flatProds = (productionsData || []).flatMap((p) =>
          (p.products || []).map((prod) => ({
            id: `${p.date}-${prod.product_id}`,
            date: p.date,
            product: prod.product_name,
            quantity: Number(prod.quantity) || 0,
          }))
        );
        setProductions(flatProds);

        setSales(
          (salesData || []).map((s) => ({
            id: s.id,
            date: s.date,
            customer: s.customer,
            total: Number(s.total) || 0,
          }))
        );

        const productsMap = products.data.reduce((map, product) => {
          map[product.id] = product;
          return map;
        }, {});

        const enrichedStocks = (stocksData || []).map((item) => {
          const product = productsMap[item.product_id];
          return {
            id: item.id,
            qty: Number(item.quantity) || 0,
            product_name: product?.name || "Unnamed Product",
            unit: product?.unit || "units",
            status: Number(item.quantity) < 20 ? "low" : "normal",
          };
        });
        setStocks(enrichedStocks);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }
    fetchAll();
  }, [token]);

  const totalMilk = collections.reduce((sum, x) => sum + x.quantity, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProductions = new Set(productions.map((p) => p.id)).size + 1 ;
  const stockCount = stocks.reduce((sum, s) => sum + s.qty, 0);

  return (
    <main className="min-h-screen mt-10 sm:p-6 bg-background text-foreground">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Snapshot of current dairy operations</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="text-sm">
          <Truck className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Milk Collected" value={`${totalMilk.toFixed(2)} L`} icon={<Milk className="w-4 h-4 text-primary" />} />
        <SummaryCard title="Total Productions" value={totalProductions} icon={<ClipboardList className="w-4 h-4 text-primary" />} />
        <SummaryCard title="Total Sales" value={`₹${totalSales.toFixed(2)}`} icon={<DollarSign className="w-4 h-4 text-primary" />} />
        <SummaryCard title="Stock On Hand" value={`${stockCount} units`} icon={<Package className="w-4 h-4 text-primary" />} />
      </section>

      <section className="mb-6">
        <Card className="shadow-md border border-border bg-card rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Stock by Product</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Live inventory data</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stocks} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3a3a3c" />
                <XAxis dataKey="product_name" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} style={{ fontSize: "11px", fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip cursor={{ fill: "hsl(var(--accent)/0.1)" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30}>
                  <LabelList dataKey="qty" position="top" style={{ fill: "hsl(var(--foreground))", fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DataTable title="Recent Productions" description="Latest items manufactured" headers={["Date", "Product", "Quantity"]} rows={productions.slice(-5).reverse().map(p => [new Date(p.date).toLocaleDateString(), p.product, p.quantity])} badgeClass="bg-green-800 text-green-100" />

        <DataTable title="Recent Sales" description="Latest transactions" headers={["Date", "Customer", "Total"]} rows={sales.slice(-5).reverse().map(s => [new Date(s.date).toLocaleDateString(), s.customer, `₹${s.total.toFixed(2)}`])} badgeClass="bg-blue-800 text-blue-100" />
      </section>
    </main>
  );
}

function SummaryCard({ title, value, icon }) {
  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <CardDescription className="text-base sm:text-xl font-semibold text-foreground">{value}</CardDescription>
        </div>
        <div className="p-1 sm:p-2 bg-muted rounded-full">{icon}</div>
      </CardHeader>
    </Card>
  );
}

function DataTable({ title, description, headers, rows, badgeClass }) {
  return (
    <Card className="rounded-xl border border-border bg-background/70 backdrop-blur shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase tracking-widest">
              {headers.map((h, i) => (
                <th key={i} className="text-left whitespace-nowrap px-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`rounded-lg ${i % 2 === 0 ? "bg-muted/20" : ""} hover:bg-muted/40`}>
                {row.map((cell, j) => (
                  <td key={j} className="py-2 px-2 font-medium text-foreground">
                    {j === 2 ? (
                      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>{cell}</span>
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
