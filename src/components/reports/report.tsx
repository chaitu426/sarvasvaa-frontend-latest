// components/ReportPdf.tsx
import { useEffect } from "react";
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

pdfMake.vfs = pdfFonts?.default?.pdfMake?.vfs || pdfFonts?.pdfMake?.vfs;

interface ReportData {
  milk: any[];
  productions: any[];
  sales: any[];
}

interface ReportPdfProps {
  data: ReportData;
  period: string;
  date: string;
}

const getReadablePeriod = (period: string, rawDate: string) => {
  const today = new Date();
  if (period === "day") return format(parseISO(rawDate), "do MMMM yyyy");

  if (period === "week") { 
    const ref = parseISO(rawDate);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    return `${format(start, "do MMM")} – ${format(end, "do MMM yyyy")}`;
  }

  if (period === "month") {
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const year = today.getFullYear();
    const monthNum = monthMap[rawDate.toLowerCase()];
    const start = startOfMonth(new Date(year, monthNum));
    return format(start, "MMMM yyyy");
  }

  return "";
};

const getTitle = (period: string) => {
  if (period === "day") return "Daily Report";
  if (period === "week") return "Weekly Report";
  if (period === "month") return "Monthly Report";
  return "Report";
};

const milkTable = (milk: any[]) => ({
  table: {
    headerRows: 1,
    widths: ["auto", "*", "*", "*", "*", "*", "*", "*"],
    body: [
      [
        { text: "No.", style: "tableHeader" },
        "Date", "Time", "Quantity (L)", "Rate", "Milk Type", "Fat", "SNF",
      ],
      ...milk.map((m: any, i: number) => [
        i + 1,
        m.date, m.collection_time, m.quantity_ltr,
        m.cost_per_litre, m.milk_type, m.fat, m.snf,
      ]),
    ],
  },
  layout: "lightHorizontalLines",
});

const productionSections = (productions: any[]) =>
  productions.map((p: any, i: number) => [
    { text: `Batch #${p.batch_no} — ${p.date}`, style: "subSectionTitle" },
    {
      columns: [
        { text: `Milk Used: ${p.milk_used_ltr} L`, width: "33%" },
        { text: `Skim Milk: ${p.sepration_milk_ltr} L`, width: "33%" },
        { text: `Whole Milk: ${p.whole_milk_ltr} L`, width: "34%" },
      ],
      margin: [0, 0, 0, 5],
    },
    {
      table: {
        headerRows: 1,
        widths: ["auto", "*", "*", "*"],
        body: [
          [
            { text: "No.", style: "tableHeader" },
            "Product", "Qty", "Raw Materials",
          ],
          ...p.products.map((prod: any, idx: number) => [
            idx + 1,
            prod.product_name,
            prod.quantity,
            prod.rawMaterials
              .map((rm: any) => `${rm.name.trim()}: ${parseFloat(rm.quantity_used).toFixed(2)} ${rm.unit.trim()}`)
              .join(", "),
          ])
          ,
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 10],
    },
  ]).flat();

const salesTable = (sales: any[]) => ({
  table: {
    headerRows: 1,
    widths: ["auto", "*", "*", "*", "*", "*", "*", "*"],
    body: [
      [
        { text: "No.", style: "tableHeader" },
        "Date", "Customer", "Product", "Qty", "Rate", "Total", "Status",
      ],
      ...sales.map((s: any, i: number) => [
        i + 1,
        s.date,
        s.customer,
        s.product_name,
        s.quantity,
        s.rate,
        s.total,
        s.payment_status,
      ]),
    ],
  },
  layout: "lightHorizontalLines",
});

const ReportPdf: React.FC<ReportPdfProps> = ({ data, period, date }) => {
  useEffect(() => {
    if (!data) return;

    const docDefinition = {
      info: {
        title: `Sarvasvaa Dairy ${getTitle(period)} (${date})`,
        author: "Sarvasvaa Dairy",
        subject: "Automated Dairy Report",
      },
      pageSize: "A4",
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.4,
      },
      content: [
        // Header with title and branding
        {
          columns: [
            {
              stack: [
                { text: "Sarvasvaa Milk & Milk Production", style: "brand" },
                { text: "Khandobachiwadi, Mohol, Solapur, Maharashtra", style: "address" },
              ],
              width: "*",
            },
            {
              stack: [
                { text: getTitle(period), style: "reportTitle", alignment: "right" },
                { text: getReadablePeriod(period, date), style: "reportDate", alignment: "right" },
              ],
              width: "auto",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }] },
        "\n",
      
        // Milk Section
        { text: "Milk Collections", style: "sectionHeader"},
        milkTable(data.milk),
      
        // Productions
        { text: "Productions", style: "sectionHeader", pageBreak: "before" },
        ...productionSections(data.productions),
      
        // Sales
        { text: "Sales", style: "sectionHeader", pageBreak: "before" },
        salesTable(data.sales),
      ],
      
      styles: {
        brand: {
          fontSize: 16,
          bold: true,
          color: "#003366",
        },
        address: {
          fontSize: 10,
          color: "#555",
          margin: [0, 2, 0, 0],
        },
        reportTitle: {
          fontSize: 14,
          bold: true,
        },
        reportDate: {
          fontSize: 10,
          margin: [0, 2, 0, 0],
        },
        sectionHeader: {
          fontSize: 13,
          bold: true,
          color: "#222",
          margin: [0, 10, 0, 5],
        },
        subSectionTitle: {
          fontSize: 11,
          bold: true,
          margin: [0, 8, 0, 3],
          color: "#444",
        },
        tableHeader: {
          bold: true,
          fillColor: "#f2f2f2",
        },
      },
    };

    pdfMake.createPdf(docDefinition).download(`Sarvasvaa-${period}-report-${date}.pdf`);
  }, [data]);

  return null;
};

export default ReportPdf;
