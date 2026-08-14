import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumber } from "@/lib/format";
import { Calendar, Package, TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  costPrice?: number; // Xarid narxi
}

interface ProductPurchase {
  purchaseNumber: string;
  purchaseDate: string;
  supplierName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

interface ProductSalesHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productSku?: string;
  productCategory?: string;
  sales: ProductSale[];
  purchases: ProductPurchase[];
}

export function ProductSalesHistoryDialog({
  open,
  onClose,
  productName,
  productSku,
  productCategory,
  sales,
  purchases,
}: ProductSalesHistoryDialogProps) {
  // Sotish statistikasi
  const totalSales = sales.length;
  const totalQuantitySold = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const avgSalePrice = totalQuantitySold > 0 ? totalSalesAmount / totalQuantitySold : 0;
  
  // Xarid statistikasi
  const totalPurchases = purchases.length;
  const totalQuantityPurchased = purchases.reduce((sum, purchase) => sum + (purchase.quantity || 0), 0);
  const totalPurchaseAmount = purchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
  const avgCostPrice = totalQuantityPurchased > 0 ? totalPurchaseAmount / totalQuantityPurchased : 0;
  
  // Foyda hisoblash
  const totalProfit = totalSalesAmount - totalPurchaseAmount;
  const profitMargin = totalSalesAmount > 0 ? (totalProfit / totalSalesAmount) * 100 : 0;
  
  // Unikal mijozlar soni
  const uniqueCustomers = new Set(sales.map(sale => sale.customerName)).size;
  const uniqueSuppliers = new Set(purchases.map(p => p.supplierName)).size;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {productName}
            {productCategory && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                · {productCategory}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Umumiy statistika */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-100 p-3 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sotilgan</p>
                    <p className="text-2xl font-bold">{totalQuantitySold} ta</p>
                    <p className="text-xs text-green-600">
                      {formatNumber(totalSalesAmount)} so'm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sotib olingan</p>
                    <p className="text-2xl font-bold">{totalQuantityPurchased} ta</p>
                    <p className="text-xs text-blue-600">
                      {formatNumber(totalPurchaseAmount)} so'm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${totalProfit >= 0 ? 'border-purple-300 bg-purple-50' : 'border-red-300 bg-red-50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${totalProfit >= 0 ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Umumiy foyda</p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfit)} so'm
                    </p>
                    <p className={`text-xs ${totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(1)}% margin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Qo'shimcha statistika */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Sotish martalar</p>
              <p className="text-lg font-semibold">{totalSales} marta</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Xarid martalar</p>
              <p className="text-lg font-semibold">{totalPurchases} marta</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">O'rtacha sotish</p>
              <p className="text-lg font-semibold">{formatNumber(avgSalePrice)} so'm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">O'rtacha xarid</p>
              <p className="text-lg font-semibold">{formatNumber(avgCostPrice)} so'm</p>
            </div>
          </div>

          {/* Tabs: Sotish tarixi va Xarid tarixi */}
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales">
                Sotish tarixi ({totalSales})
              </TabsTrigger>
              <TabsTrigger value="purchases">
                Xarid tarixi ({totalPurchases})
              </TabsTrigger>
            </TabsList>

            {/* Sotish tarixi */}
            <TabsContent value="sales" className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyurtma</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Mijoz</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead className="text-right">Narx</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                      <TableHead className="text-right">Foyda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Hozircha sotilmagan
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale, index) => {
                        const profit = sale.costPrice 
                          ? (sale.price - sale.costPrice) * sale.quantity 
                          : null;
                        const profitPercent = sale.costPrice 
                          ? ((sale.price - sale.costPrice) / sale.price) * 100 
                          : null;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {sale.orderNumber}
                            </TableCell>
                            <TableCell className="text-sm">{sale.orderDate}</TableCell>
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
                            <TableCell className="text-right">
                              {profit !== null ? (
                                <div>
                                  <p className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {profit >= 0 ? '+' : ''}{formatNumber(profit)} so'm
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {profitPercent?.toFixed(1)}%
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Xarid tarixi */}
            <TabsContent value="purchases" className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xarid ID</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Ta'minotchi</TableHead>
                      <TableHead className="text-right">Miqdor</TableHead>
                      <TableHead className="text-right">Narx</TableHead>
                      <TableHead className="text-right">Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Hozircha xarid qilinmagan
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((purchase, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {purchase.purchaseNumber}
                          </TableCell>
                          <TableCell className="text-sm">{purchase.purchaseDate}</TableCell>
                          <TableCell>{purchase.supplierName}</TableCell>
                          <TableCell className="text-right">
                            {purchase.quantity || 0} ta
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(purchase.costPrice || 0)} so'm
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {formatNumber(purchase.total || 0)} so'm
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
