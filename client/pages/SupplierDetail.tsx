import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  Star,
  TrendingUp,
  PackageX,
  DollarSign,
  Calendar,
  Filter,
  Search,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
import { formatNumber, formatUzPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useSupplierDetail,
  useSupplierPurchases,
  useSupplierProducts,
  useSupplierReturns,
  useSupplierFinancial,
  useSupplierKPI,
  useReturnProductToSupplier,
} from "@/hooks/use-api";
import type {
  SupplierPurchase,
  SupplierProduct,
  SupplierReturn,
  FinancialRecord,
  PurchaseItem,
} from "@shared/api";
import { ProductReturnDialog } from "@/components/ProductReturnDialog";
import { toast } from "sonner";

/** Rating component */
function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Baho: ${value} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={cn(
            star <= value ? "fill-[#e0a944] text-[#e0a944]" : "text-slate-200",
          )}
        />
      ))}
    </span>
  );
}

/** KPI Stat Card */
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "text-[#173f38]",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn("rounded-lg bg-slate-100 p-3", color)}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("purchases");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);

  // API hooks
  const { data: detailData, isLoading: detailLoading } = useSupplierDetail(id!);
  const { data: kpiData, isLoading: kpiLoading } = useSupplierKPI(id!);
  const { data: purchasesData, isLoading: purchasesLoading } = useSupplierPurchases(id!);
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useSupplierProducts(id!);
  const { data: returnsData, isLoading: returnsLoading } = useSupplierReturns(id!);
  const { data: financialData, isLoading: financialLoading } = useSupplierFinancial(id!);

  const returnMutation = useReturnProductToSupplier();

  const supplier = detailData?.data?.supplier;
  const stats = kpiData?.data || {
    totalPurchases: 0,
    ordersCount: 0,
    avgRating: 0,
    returnsCount: 0,
  };
  const purchases = purchasesData?.data || [];
  const products = productsData?.data || [];
  const returns = returnsData?.data || [];
  const financial = financialData?.data || { summary: { totalPaid: 0, currentDebt: 0 }, history: [] };

  const handleProductReturn = async (data: {
    productId: string;
    quantity: number;
    reason: import("@shared/api").ReturnProductRequest["reason"];
    note: string;
  }) => {
    try {
      // Find the product to get current quantity
      const product = products.find(p => p.id === data.productId);
      if (!product) {
        toast.error("Mahsulot topilmadi");
        return;
      }

      const newQuantity = product.quantity - data.quantity;

      // Optimistic update: immediately update UI
      queryClient.setQueryData(
        ['supplier-products', id],
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p: SupplierProduct) =>
              p.id === data.productId
                ? { ...p, quantity: newQuantity }
                : p
            ),
          };
        }
      );

      // Also update global products cache
      queryClient.setQueryData(
        ['products'],
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((p: any) =>
              p.id === data.productId
                ? { ...p, quantity: newQuantity }
                : p
            ),
          };
        }
      );

      await returnMutation.mutateAsync({ id: id!, ...data });
      
      toast.success("Mahsulot qaytarildi!", {
        description: `${data.quantity} ta mahsulot ta'minotchiga qaytarildi. Qolgan: ${newQuantity} ta`,
      });
      
      // Mahsulotlar ro'yxatini yangilash
      await refetchProducts();
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      
      setShowReturnDialog(false);
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['supplier-products', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.error("Xatolik yuz berdi", {
        description: error instanceof Error ? error.message : "Mahsulotni qaytarishda muammo yuz berdi",
      });
    }
  };

  // Filter functions
  const filteredPurchases = purchases.filter((purchase) => {
    // Search filter
    const matchesSearch = !searchQuery || 
      purchase.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.items?.some((item: PurchaseItem) => 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const purchaseDate = new Date(purchase.orderDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === "today") {
        purchaseDate.setHours(0, 0, 0, 0);
        matchesDate = purchaseDate.getTime() === today.getTime();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = purchaseDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate = purchaseDate.getMonth() === today.getMonth() &&
                     purchaseDate.getFullYear() === today.getFullYear();
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const filteredProducts = products.filter((product) => {
    return !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredReturns = returns.filter((returnItem) => {
    return statusFilter === "all" || returnItem.status === statusFilter;
  });

  if (detailLoading || kpiLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#173f38]" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Ta'minotchi topilmadi</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/suppliers")}
          >
            <ArrowLeft size={16} className="mr-2" />
            Qaytish
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: BadgeProps["variant"]; text: string }> = {
      active: { variant: "default", text: "Faol" },
      inactive: { variant: "secondary", text: "Arxivda" },
      paid: { variant: "default", text: "To'langan" },
      partial: { variant: "secondary", text: "Qisman" },
      unpaid: { variant: "destructive", text: "To'lanmagan" },
      delivered: { variant: "default", text: "Yetkazildi" },
      pending: { variant: "secondary", text: "Kutilmoqda" },
      cancelled: { variant: "destructive", text: "Bekor qilindi" },
      approved: { variant: "default", text: "Tasdiqlandi" },
    };

    const config = variants[status] || { variant: "secondary" as const, text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getReasonText = (reason: string) => {
    const reasons: Record<string, string> = {
      defective: "Nuqsonli mahsulot",
      wrong_item: "Noto'g'ri mahsulot",
      damaged: "Shikastlangan",
      quality: "Sifatsiz",
      expired: "Muddati o'tgan",
      other: "Boshqa",
    };
    return reasons[reason] || reason;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/suppliers")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#173f38]">
              Ta'minotchi profili
            </h1>
            <p className="text-sm text-muted-foreground">
              Batafsil ma'lumotlar va tarix
            </p>
          </div>
        </div>
      </div>

      {/* Supplier Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100">
                <Building2 size={48} className="text-[#173f38]" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{supplier.name}</h2>
                    {getStatusBadge(supplier.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {supplier.category}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Rating value={supplier.rating} />
                    <span className="text-sm text-muted-foreground">
                      ({supplier.rating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-muted-foreground" />
                  <span className="font-medium">{supplier.contactPerson}:</span>
                  <span>{formatUzPhone(supplier.phone)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-muted-foreground" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-start gap-2 text-sm md:col-span-2">
                  <MapPin size={16} className="mt-0.5 text-muted-foreground" />
                  <span>{supplier.address}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Jami xaridlar summasi"
          value={`${formatNumber(stats.totalPurchases)} so'm`}
          subtitle="Barcha vaqt davomida"
          color="text-green-600"
        />
        <StatCard
          icon={ShoppingCart}
          label="Buyurtmalar soni"
          value={stats.ordersCount}
          subtitle="Yetkazilgan buyurtmalar"
          color="text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="O'rtacha baho"
          value={stats.avgRating.toFixed(1)}
          subtitle="5 ball tizimi bo'yicha"
          color="text-[#e0a944]"
        />
        <StatCard
          icon={PackageX}
          label="Qaytarilgan mahsulotlar"
          value={stats.returnsCount}
          subtitle="Jami vozvratlar"
          color="text-red-600"
        />
      </div>

      {/* Action Buttons */}
      {supplier?.status === "active" && products.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowReturnDialog(true)}
            className="bg-[#cb8535] hover:bg-[#b87530]"
          >
            <PackageX size={16} className="mr-2" />
            Mahsulotni qaytarish
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="purchases">Xaridlar tarixi</TabsTrigger>
          <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
          <TabsTrigger value="returns">Qaytaruvlar</TabsTrigger>
          <TabsTrigger value="financial">Moliya</TabsTrigger>
        </TabsList>

        {/* Purchase History Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Xaridlar tarixi</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search
                      className="absolute left-2 top-2.5 text-muted-foreground"
                      size={16}
                    />
                    <Input
                      placeholder="Qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha vaqt</SelectItem>
                      <SelectItem value="today">Bugun</SelectItem>
                      <SelectItem value="week">Bu hafta</SelectItem>
                      <SelectItem value="month">Bu oy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyurtma ID</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead className="text-right">Miqdor</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>To'lov</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase: SupplierPurchase) => {
                    const totalQty = purchase.items?.reduce((sum: number, item: PurchaseItem) => sum + item.quantity, 0) || 0;
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.purchaseNumber}
                        </TableCell>
                        <TableCell>{purchase.orderDate}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {purchase.items?.map((item: PurchaseItem, idx: number) => (
                              <div key={idx} className="text-sm">
                                {item.productName} ({item.quantity} ta)
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {totalQty} ta
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(purchase.total)} so'm
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(purchase.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(purchase.status)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Yetkazib berilgan mahsulotlar</CardTitle>
                <div className="relative">
                  <Search
                    className="absolute left-2 top-2.5 text-muted-foreground"
                    size={16}
                  />
                  <Input
                    placeholder="Mahsulot qidirish..."
                    className="pl-8 w-[250px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahsulot nomi</TableHead>
                    <TableHead>SKU/Kodi</TableHead>
                    <TableHead className="text-right">Ombor qoldig'i</TableHead>
                    <TableHead className="text-right">Oxirgi narx</TableHead>
                    <TableHead>Oxirgi yetkazilgan</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: SupplierProduct) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || `${product.category?.substring(0, 3).toUpperCase()}-${product.id}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.quantity} ta
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(product.price)} so'm
                      </TableCell>
                      <TableCell>
                        {product.lastDeliveryDate || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowReturnDialog(true);
                          }}
                          disabled={product.quantity === 0}
                        >
                          <PackageX className="mr-2 h-4 w-4" />
                          Qaytarish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Qaytarilgan mahsulotlar tarixi</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    <SelectItem value="approved">Tasdiqlandi</SelectItem>
                    <SelectItem value="pending">Kutilmoqda</SelectItem>
                    <SelectItem value="rejected">Rad etildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Xarid ID</TableHead>
                    <TableHead>Mahsulot</TableHead>
                    <TableHead className="text-right">Miqdor</TableHead>
                    <TableHead>Sabab</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead>Holat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Qaytarilgan mahsulotlar yo'q
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReturns.map((returnItem: SupplierReturn) => (
                      <TableRow key={returnItem.id}>
                        <TableCell>{returnItem.returnDate}</TableCell>
                        <TableCell className="font-medium">
                          {returnItem.purchaseNumber}
                        </TableCell>
                        <TableCell>{returnItem.productName}</TableCell>
                        <TableCell className="text-right">
                          {returnItem.quantity} ta
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {getReasonText(returnItem.reason)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {returnItem.reasonText}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(returnItem.amount)} so'm
                        </TableCell>
                        <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Jami to'lovlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(financial.summary?.totalPaid || 0)} so'm
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Joriy qarz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(financial.summary?.currentDebt || 0)} so'm
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  So'nggi to'lov
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financial.summary?.lastPaymentDate || "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>To'lovlar va qarzlar tarixi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead className="text-right">Summa</TableHead>
                    <TableHead className="text-right">Balans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financial.history?.map((item: FinancialRecord) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          item.type === "payment"
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {item.type === "payment" ? "+" : "-"}
                        {formatNumber(item.amount)} so'm
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(Math.abs(item.balance))} so'm
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Return Dialog */}
      {supplier && (
        <ProductReturnDialog
          open={showReturnDialog}
          onOpenChange={(open) => {
            setShowReturnDialog(open);
            if (!open) setSelectedProduct(null); // Reset selected product when closing
          }}
          supplier={supplier}
          products={products}
          defaultProductId={selectedProduct?.id}
          onSubmit={handleProductReturn}
        />
      )}
    </div>
  );
}
