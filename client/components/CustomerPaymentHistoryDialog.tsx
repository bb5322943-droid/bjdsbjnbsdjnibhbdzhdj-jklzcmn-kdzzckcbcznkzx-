import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { Calendar, CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentRecord {
  date: string;
  orderNumber?: string;
  type: 'payment' | 'order' | 'adjustment';
  amount: number;
  balance: number;
  note?: string;
}

interface CustomerPaymentHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  currentDebt: number;
  payments: PaymentRecord[];
}

export function CustomerPaymentHistoryDialog({
  open,
  onClose,
  customerName,
  customerPhone,
  currentDebt,
  payments,
}: CustomerPaymentHistoryDialogProps) {
  // Statistika
  const totalPayments = payments.filter(p => p.type === 'payment').length;
  const totalPaid = payments
    .filter(p => p.type === 'payment')
    .reduce((sum, p) => sum + Math.abs(p.amount || 0), 0);
  const totalDebt = payments
    .filter(p => p.type === 'order')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastPaymentDate = payments.find(p => p.type === 'payment')?.date;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {customerName}
            {customerPhone && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({customerPhone})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Joriy qarz */}
          <Card className={currentDebt > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Joriy qarz</p>
                  <p className={`text-3xl font-bold ${currentDebt > 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatNumber(currentDebt)} so'm
                  </p>
                </div>
                {currentDebt > 0 ? (
                  <div className="rounded-lg bg-red-100 p-3 text-red-600">
                    <TrendingUp size={32} />
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-100 p-3 text-green-600">
                    <TrendingDown size={32} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistika kartalari */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To'lovlar soni</p>
                    <p className="text-2xl font-bold">{totalPayments} ta</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-100 p-3 text-green-600">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami to'langan</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(totalPaid)} so'm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Oxirgi to'lov</p>
                    <p className="text-lg font-bold">
                      {lastPaymentDate || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jami qarz */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Jami qarz (barcha vaqt)</p>
            <p className="text-xl font-semibold">
              {formatNumber(totalDebt)} so'm
            </p>
          </div>

          {/* To'lov tarixi jadvali */}
          <div>
            <h3 className="text-lg font-semibold mb-4">To'lov va qarz tarixi</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Buyurtma</TableHead>
                    <TableHead>Tur</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead className="text-right">Balans</TableHead>
                    <TableHead>Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Hozircha tarix yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.orderNumber || "—"}
                        </TableCell>
                        <TableCell>
                          {record.type === 'payment' && (
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              To'lov
                            </Badge>
                          )}
                          {record.type === 'order' && (
                            <Badge variant="outline" className="bg-red-100 text-red-700">
                              Qarz
                            </Badge>
                          )}
                          {record.type === 'adjustment' && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              Tuzatish
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          record.type === 'payment' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {record.type === 'payment' ? '-' : '+'}{formatNumber(Math.abs(record.amount || 0))} so'm
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatNumber(Math.abs(record.balance || 0))} so'm
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {record.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
