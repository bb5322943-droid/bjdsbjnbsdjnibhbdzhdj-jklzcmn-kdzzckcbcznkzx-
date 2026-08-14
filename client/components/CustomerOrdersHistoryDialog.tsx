import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { Calendar, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
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

interface CustomerOrder {
  orderNumber: string;
  orderDate: string;
  itemsCount: number;
  total: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: string;
}

interface CustomerOrdersHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  orders: CustomerOrder[];
}

const PAYMENT_STATUS_LABELS = {
  paid: { label: "To'langan", color: "bg-green-100 text-green-700" },
  partial: { label: "Qisman", color: "bg-yellow-100 text-yellow-700" },
  unpaid: { label: "To'lanmagan", color: "bg-red-100 text-red-700" },
};

export function CustomerOrdersHistoryDialog({
  open,
  onClose,
  customerName,
  customerPhone,
  orders,
}: CustomerOrdersHistoryDialogProps) {
  // Statistika
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;
  const lastOrderDate = orders.length > 0 ? orders[0].orderDate : null;

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
          {/* Statistika kartalari */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buyurtmalar</p>
                    <p className="text-2xl font-bold">{totalOrders} ta</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-100 p-3 text-green-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami summa</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(totalAmount)} so'm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">O'rtacha</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(avgOrderAmount)} so'm
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
                    <p className="text-sm text-muted-foreground">Oxirgi buyurtma</p>
                    <p className="text-lg font-bold">
                      {lastOrderDate || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Buyurtmalar jadvali */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Buyurtmalar tarixi</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Mahsulotlar</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>To'lov</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Hozircha buyurtmalar yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>{order.orderDate}</TableCell>
                        <TableCell className="text-right">
                          {order.itemsCount || 0} ta
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatNumber(order.total || 0)} so'm
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={PAYMENT_STATUS_LABELS[order.paymentStatus]?.color || ""}
                          >
                            {PAYMENT_STATUS_LABELS[order.paymentStatus]?.label || order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
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
