"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DailyMilkCollectionChart } from "@/components/LineGraph";

// Skeleton loader component
function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-32 bg-muted rounded"></div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-6 w-full bg-muted rounded-lg"></div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ReportsDashboard() {
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(new Date());
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(new Date());

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchMonthlyReport = async (month: string) => {
    try {
      setLoadingMonthly(true);
      const res = await fetch(`${apiUrl}/reports/summary?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMonthlyData(data);
    } catch (err) {
      console.error("Error fetching monthly report", err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const fetchWeeklyReport = async (week: string) => {
    try {
      setLoadingWeekly(true);
      const res = await fetch(`${apiUrl}/reports/weekly?week=${week}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWeeklyData(data);
    } catch (err) {
      console.error("Error fetching weekly report", err);
    } finally {
      setLoadingWeekly(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      const monthStr = format(selectedMonth, "yyyy-MM");
      fetchMonthlyReport(monthStr);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedWeek) {
      const weekStr = format(selectedWeek, "yyyy-'W'II");
      fetchWeeklyReport(weekStr);
    }
  }, [selectedWeek]);

  return (
    <div className="space-y-10 mt-10 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dairy Reports Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Analyze milk collection, production, and sales data.
          </p>
        </div>

        {/* Date Pickers */}
        <div className="flex flex-wrap gap-2">
          {/* Month Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedMonth
                  ? format(selectedMonth, "MMMM yyyy")
                  : "Select Month"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={setSelectedMonth}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>

          {/* Week Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedWeek
                  ? format(selectedWeek, "'Week' II, yyyy")
                  : "Select Week"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={setSelectedWeek}
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Monthly Section */}
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold border-b pb-2">
          Monthly Summary
        </h2>

        {loadingMonthly ? (
          <div className="grid gap-4">
            <SkeletonCard />
            <SkeletonCard lines={4} />
            <SkeletonCard lines={2} />
          </div>
        ) : (
          monthlyData && (
            <>
              {/* Milk Collection */}
              <Card>
                <CardHeader>
                  <CardTitle>Milk Collection</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <p>
                    Total Collected:{" "}
                    <strong>
                      {monthlyData?.milk_collected?.total_quantity ?? 0} L
                    </strong>
                  </p>
                  <p>
                    Total Cost:{" "}
                    <strong>
                      ₹{monthlyData?.milk_collected?.total_cost ?? 0}
                    </strong>
                  </p>
                  <p>
                    Avg Cost/Litre:{" "}
                    <strong>
                      ₹
                      {parseFloat(
                        monthlyData?.milk_collected?.avg_cost_per_litre ?? 0
                      ).toFixed(2)}
                    </strong>
                  </p>
                </CardContent>
              </Card>

              {/* Production */}
              <Card>
                <CardHeader>
                  <CardTitle>Production</CardTitle>
                </CardHeader>
                <CardContent className="divide-y text-sm">
                  {monthlyData?.productions?.map((prod: any) => (
                    <div
                      key={prod.product_id}
                      className="flex justify-between py-2"
                    >
                      <span>{prod.product_name}</span>
                      <span>
                        {prod.total_produced} units · {prod.total_milk_used} L
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    Total Sold:{" "}
                    <strong>
                      {monthlyData?.sales?.total_quantity ?? 0} units
                    </strong>
                  </div>
                  <div>
                    Revenue:{" "}
                    <strong>
                      ₹{monthlyData?.sales?.total_revenue ?? 0}
                    </strong>
                  </div>
                  <div>
                    Unpaid:{" "}
                    <strong className="text-yellow-600">
                      ₹{monthlyData?.sales?.unpaid ?? 0}
                    </strong>
                  </div>
                  <div>
                    Avg Sale Value:{" "}
                    <strong>
                      ₹
                      {parseFloat(
                        monthlyData?.sales?.avg_sale_value ?? 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                </CardContent>
              </Card>
            </>
          )
        )}
      </section>

      {/* Weekly Section */}
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold border-b pb-2">
          Weekly Breakdown
        </h2>

        {loadingWeekly ? (
          <div className="grid gap-4">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        ) : (
          weeklyData && (
            <>
              {/* Daily Milk */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Milk Collection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {weeklyData?.milk_collected_daily?.map(
                    (entry: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between border-b pb-1"
                      >
                        <span>{entry.date}</span>
                        <span className="font-medium text-blue-700">
                          {entry.total} L
                        </span>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* Daily Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {weeklyData?.sales_daily?.map((entry: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between border-b pb-1"
                    >
                      <span>{entry.date}</span>
                      <span className="font-medium text-green-700">
                        ₹{entry.revenue}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )
        )}
      </section>
    </div>
  );
}
