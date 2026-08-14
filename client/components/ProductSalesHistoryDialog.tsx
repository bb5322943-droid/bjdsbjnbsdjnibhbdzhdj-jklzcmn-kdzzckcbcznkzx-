import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { Calendar, Package, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductSale {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  quantity: number;
  price: number;
  total: number;
}

interface ProductSalesHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productSku?: string;
  sales: ProductSale[];
}

export function ProductSalesHistoryDialog({
  open,
  onClose,
  productName,
  productSku,
  sales,
}: ProductSalesHistoryDialogProps) {
  // Statistika
  const totalSales = sales.length;
  const totalQuantity = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
  
  // Unikal mijozlar soni
  const uniqueCustomers = new Set(sales.map(sale => sale.customerName)).size;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {productName}
            {productSku && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({productSku})
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
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sotilgan</p>
                    <p className="text-2xl font-bold">{totalSales} marta</p>
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

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mijozlar</p>
                    <p className="text-2xl font-bold">{uniqueCustomers} ta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* O'rtacha narx */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">O'rtacha sotish narxi</p>
            <p className="text-xl font-semibold">
              {formatNumber(avgPrice)} so'm/dona
            </p>
          </div>

          {/* Sotilgan tarixi jadvali */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sotilgan tarixi</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead className="text-right">Miqdor</TableHead>
                    <TableHead className="text-right">Narx</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Hozircha sotilmagan
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {sale.orderNumber}
                        </TableCell>
                        <TableCell>{sale.orderDate}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell className="text-right">
                          {sale.quantity || 0} ta
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(sale.price || 0)} so'm
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatNumber(sale.total || 0)} so'm
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
