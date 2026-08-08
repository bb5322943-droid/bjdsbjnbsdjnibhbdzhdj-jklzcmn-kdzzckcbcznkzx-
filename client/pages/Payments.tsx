import { useState } from "react";
import { PageHeader } from "@/components/PageKit";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Search,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

// Mock data - keyinchalik API dan keladi
interface Payment {
  id: string;
  date: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  cashAmount: number;
  cardAmount: number;
  terminalAmount: number;
  paymentType: "cash" | "card" | "terminal" | "mixed";
  note?: string;
}

const mockPayments: Payment[] = [
  {
    id: "1",
    date: "2024-01-15T10:30:00",
    customerName: "Alisher Narimanov",
    orderNumber: "ORD-1001",
    totalAmount: 5000000,
    cashAmount: 3000000,
    cardAmount: 2000000,
    terminalAmount: 0,
    paymentType: "mixed",
    note: "Qisman to'lov",
  },
  {
    id: "2",
    date: "2024-01-15T11:45:00",
    customerName: "Dilshod Toshmatov",
    orderNumber: "ORD-1002",
    totalAmount: 8500000,
    cashAmount: 8500000,
    cardAmount: 0,
    terminalAmount: 0,
    paymentType: "cash",
    note: "To'liq naqd to'lov",
  },
  {
    id: "3",
    date: "2024-01-15T14:20:00",
    customerName: "Gulnora Karimova",
    orderNumber: "ORD-1003",
    totalAmount: 12000000,
    cashAmount: 0,
    cardAmount: 12000000,
    terminalAmount: 0,
    paymentType: "card",
    note: "Plastik karta orqali",
  },
  {
    id: "4",
    date: "2024-01-16T09:15:00",
    customerName: "Jamshid Ergashev",
    orderNumber: "ORD-1004",
    totalAmount: 15600000,
    cashAmount: 5000000,
    cardAmount: 5000000,
    terminalAmount: 5600000,
    paymentType: "mixed",
    note: "Uchala usulda to'landi",
  },
  {
    id: "5",
    date: "2024-01-16T15:30:00",
    customerName: "Nodira Karimova",
    orderNumber: "ORD-1005",
    totalAmount: 7200000,
    cashAmount: 0,
    cardAmount: 0,
    terminalAmount: 7200000,
    paymentType: "terminal",
    note: "Terminal orqali to'lov",
  },
];

export default function Payments() {
  const [search, setSearch] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Filtrlash
  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = 
      payment.customerName.toLowerCase().includes(search.toLowerCase()) ||
      payment.orderNumber.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = 
      paymentTypeFilter === "all" || payment.paymentType === paymentTypeFilter;

    return matchesSearch && matchesType;
  });

  // Jami hisoblar
  const totalCash = filteredPayments.reduce((sum, p) => sum + p.cashAmount, 0);
  const totalCard = filteredPayments.reduce((sum, p) => sum + p.cardAmount, 0);
  const totalTerminal = filteredPayments.reduce((sum, p) => sum + p.terminalAmount, 0);
  const grandTotal = totalCash + totalCard + totalTerminal;

  // Eksport funksiyasi
  const handleExport = () => {
    try {
      // CSV Injection himoyasi
      const sanitizeCell = (value: any): string => {
        const str = String(value || '');
        // =, +, -, @ bilan boshlanuvchi qiymatlarni xavfsiz qilish
        if (/^[=+\-@\t\r]/.test(str)) {
          return "'" + str.replace(/"/g, '""');
        }
        return str.replace(/"/g, '""');
      };

      // CSV formatida ma'lumotlarni tayyorlash
      const headers = [
        "Sana",
        "Mijoz",
        "Buyurtma",
        "Jami (so'm)",
        "Naqd (so'm)",
        "Karta (so'm)",
        "Terminal (so'm)",
        "To'lov turi",
        "Izoh"
      ];

      const rows = filteredPayments.map(payment => [
        sanitizeCell(new Date(payment.date).toLocaleString("uz-UZ")),
        sanitizeCell(payment.customerName),
        sanitizeCell(payment.orderNumber),
        sanitizeCell(payment.totalAmount),
        sanitizeCell(payment.cashAmount),
        sanitizeCell(payment.cardAmount),
        sanitizeCell(payment.terminalAmount),
        sanitizeCell(getPaymentTypeLabel(payment.paymentType)),
        sanitizeCell(payment.note || "")
      ]);

      // Jami qatorni qo'shish
      rows.push([
        "",
        "",
        "JAMI:",
        grandTotal.toString(),
        totalCash.toString(),
        totalCard.toString(),
        totalTerminal.toString(),
        "",
        ""
      ].map(sanitizeCell));

      // CSV formatiga o'tkazish
      const csvContent = [
        headers.map(h => `"${sanitizeCell(h)}"`).join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // BOM qo'shish (UTF-8 encoding uchun Excel'da to'g'ri ko'rinishi uchun)
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Faylni yuklab olish
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const fileName = `tolovlar_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Memory leak oldini olish
      
      toast.success(`${filteredPayments.length} ta to'lov eksport qilindi`);
    } catch (error) {
      toast.error("Eksport qilishda xatolik yuz berdi");
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "cash": return "Naqd";
      case "card": return "Karta";
      case "terminal": return "Terminal";
      case "mixed": return "Aralash";
      default: return type;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    const baseClass = "inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium border-0 min-w-[70px]";
    
    switch (type) {
      case "cash":
        return <Badge className={`${baseClass} bg-green-600 text-white hover:bg-green-700`}>Naqd</Badge>;
      case "card":
        return <Badge className={`${baseClass} bg-blue-600 text-white hover:bg-blue-700`}>Karta</Badge>;
      case "terminal":
        return <Badge className={`${baseClass} bg-purple-600 text-white hover:bg-purple-700`}>Terminal</Badge>;
      case "mixed":
        return <Badge className={`${baseClass} bg-orange-600 text-white hover:bg-orange-700`}>Aralash</Badge>;
      default:
        return <Badge className={`${baseClass} bg-slate-600 text-white hover:bg-slate-700`}>{type}</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        title="To'lovlar"
        description="Barcha to'lovlar tarixi va statistikasi"
      />
      <div className="space-y-6">
        {/* Statistika kartlari */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Jami to'lovlar</CardTitle>
              <div className="rounded-full bg-slate-100 p-2">
                <Wallet className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(grandTotal)}</div>
              <p className="text-xs text-slate-500 mt-1">
                {filteredPayments.length} ta to'lov
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Naqd</CardTitle>
              <div className="rounded-full bg-green-100 p-2">
                <Banknote className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCash)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((totalCash / grandTotal) * 100) || 0}% jami to'lovdan
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Karta</CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalCard)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((totalCard / grandTotal) * 100) || 0}% jami to'lovdan
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Terminal</CardTitle>
              <div className="rounded-full bg-purple-100 p-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalTerminal)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((totalTerminal / grandTotal) * 100) || 0}% jami to'lovdan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtrlar va qidiruv */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">To'lovlar tarixi</CardTitle>
            <CardDescription className="text-slate-600">
              Barcha to'lovlarni ko'ring va filtrlang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Mijoz yoki buyurtma raqamini qidiring..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-full md:w-[200px] border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="To'lov turi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha to'lovlar</SelectItem>
                    <SelectItem value="cash">Naqd</SelectItem>
                    <SelectItem value="card">Karta</SelectItem>
                    <SelectItem value="terminal">Terminal</SelectItem>
                    <SelectItem value="mixed">Aralash</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full md:w-auto border-slate-300 hover:bg-slate-50" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Eksport
                </Button>
              </div>
            </div>

            {/* Jadval */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Sana</TableHead>
                    <TableHead className="font-semibold text-slate-700">Mijoz</TableHead>
                    <TableHead className="font-semibold text-slate-700">Buyurtma</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Jami</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Naqd</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Karta</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Terminal</TableHead>
                    <TableHead className="font-semibold text-slate-700">Turi</TableHead>
                    <TableHead className="font-semibold text-slate-700">Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="h-12 w-12 text-slate-300" />
                          <p className="font-medium">To'lovlar topilmadi</p>
                          <p className="text-sm">Boshqa filtrlarni sinab ko'ring</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="whitespace-nowrap font-medium text-slate-600">
                          {new Date(payment.date).toLocaleDateString("uz-UZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">{payment.customerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{payment.orderNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(payment.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {payment.cashAmount > 0 ? formatCurrency(payment.cashAmount) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {payment.cardAmount > 0 ? formatCurrency(payment.cardAmount) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-purple-600">
                          {payment.terminalAmount > 0 ? formatCurrency(payment.terminalAmount) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                        <TableCell className="text-slate-600 text-sm max-w-[200px] truncate">
                          {payment.note || <span className="text-slate-300">—</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
