import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { Calendar, Package, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductPurchase {
  date: string;
  quantity: number;
  price: number;
  total: number;
  purchaseNumber: string;
}

interface ProductHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productSku: string;
  purchases: ProductPurchase[];
}

export function ProductHistoryDialog({
  open,
  onClose,
  productName,
  productSku,
  purchases,
}: ProductHistoryDialogProps) {
  // Statistika - NaN xatolarini oldini olamiz
  const totalQuantity = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalAmount = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const purchaseCount = purchases.length;
  const avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {productName}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({productSku})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistika kartalari */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Xaridlar soni</p>
                    <p className="text-2xl font-bold">{purchaseCount} marta</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-100 p-3 text-green-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jami miqdor</p>
                    <p className="text-2xl font-bold">{totalQuantity} ta</p>
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
                    <p className="text-sm text-muted-foreground">Jami summa</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(totalAmount)} so'm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* O'rtacha narx */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">O'rtacha narx</p>
            <p className="text-xl font-semibold">
              {formatNumber(avgPrice)} so'm/dona
            </p>
          </div>

          {/* Xaridlar tarixi jadvali */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Xaridlar tarixi</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Miqdor</TableHead>
                    <TableHead className="text-right">Narx</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Hozircha xaridlar yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {purchase.purchaseNumber}
                        </TableCell>
                        <TableCell>{purchase.date}</TableCell>
                        <TableCell className="text-right">
                          {purchase.quantity || 0} ta
                        </TableCell>
                        <TableCell className="text-right">
                          {purchase.price ? formatNumber(purchase.price) : '—'} so'm
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {purchase.total ? formatNumber(purchase.total) : '—'} so'm
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
