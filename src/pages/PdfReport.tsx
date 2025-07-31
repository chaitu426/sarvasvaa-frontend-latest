import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import ReportPdf from "../components/reports/report";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const ReportPage = () => {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [month, setMonth] = useState("jan");
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const token = localStorage.getItem("dairy_token");
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const dateValue = period === "month" ? month : selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

      const res = await fetch(`${apiUrl}/reports/pdfreport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ period, date: dateValue }),
      });

      if (!res.ok) throw new Error("Failed to fetch report data");

      const data = await res.json();

      const blob = await pdf(
        <ReportPdf data={data} period={period} date={dateValue} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${period}_${dateValue}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-left">Generate Reports</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Period Selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Select Period</label>
          <Select value={period} onValueChange={(val) => setPeriod(val as "day" | "week" | "month")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker / Month Selector */}
        {period === "month" ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select Month</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose month" />
              </SelectTrigger>
              <SelectContent>
                {["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map((m) => (
                  <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mt-6 text-center">
        <Button onClick={handleGenerate} disabled={loading} className="px-6 py-2">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </span>
          ) : (
            "Generate Report"
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReportPage;
