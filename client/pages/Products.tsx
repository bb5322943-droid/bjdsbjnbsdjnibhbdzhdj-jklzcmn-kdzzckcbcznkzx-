import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { ProductDialog } from "@/components/ProductDialog";
import { StockAdjustDialog } from "@/components/StockAdjustDialog";
import { ProductSalesHistoryDialog } from "@/components/ProductSalesHistoryDialog";
import {
  ErrorState,
  HeroStat,
  PageHeader,
  RowActions,
  SearchInput,
  StatTile,
  StatusBadge,
  ViewButton,
  ViewMode,
  ViewToggle,
} from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteProduct,
  useProductFilters,
  useProducts,
  useRestockProducts,
  useStockMovements,
  useWarehouseStats,
  useOrders,
  useCustomers,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

const ALL = "__all__";

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useWarehouseStats();
  const { data: filtersData } = useProductFilters();
  const { data: ordersData } = useOrders({ page: 1, limit: 1000 }); // Barcha buyurtmalar
  const { data: customersData } = useCustomers({ page: 1, limit: 1000 }); // Barcha mijozlar
  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit: 10,
    search: debouncedSearch,
    category: category === ALL ? undefined : category,
    location: location === ALL ? undefined : location,
    lowStockOnly,
  });
  const deleteProduct = useDeleteProduct();
  const restock = useRestockProducts();
  const { data: movementsData, isLoading: movementsLoading } =
    useStockMovements({ limit: 8 });

  const stats = statsData?.data;
  const products = data?.data ?? [];
  const pagination = data?.pagination;
  const categories = filtersData?.data.categories ?? [];
  const locations = filtersData?.data.locations ?? [];
  const movements = movementsData?.data ?? [];
  const allOrders = ordersData?.data ?? [];
  const allCustomers = customersData?.data ?? [];

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  // Xato bo'lsa ConfirmDialog uni ushlab, xabar ko'rsatadi va oynani ochiq qoldiradi.
  const handleDelete = async () => {
    if (!deleting) return;
    await deleteProduct.mutateAsync(deleting.id);
    toast.success(`${deleting.name} omborlardan o'chirildi`);
  };

  const handleRestock = async () => {
    const result = await restock.mutateAsync();
    toast.success(result.message ?? "Qoldiqlar to'ldirildi");
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

  /** Qator menyusidagi qo'shimcha band — jadval va kartochkada bir xil. */
  const productMenuItems = (product: Product) => (
    <>
      <DropdownMenuItem
        onSelect={() => setAdjusting(product)}
        className="gap-2"
      >
        <SlidersHorizontal size={15} className="text-slate-400" /> Qoldiqni
        tuzatish
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );

  const columns: Column<Product>[] = [
    {
      header: "Mahsulot",
      cell: (product) => (
        <div className="min-w-0 max-w-md">
          <button
            onClick={() => {
              setHistoryProduct(product);
              setShowHistoryDialog(true);
            }}
            className="text-left hover:text-[#173f38] transition-colors"
          >
            <p className="truncate text-sm font-medium text-slate-900 hover:underline">
              {product.name}
            </p>
          </button>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {product.category}
          </p>
        </div>
      ),
    },
    {
      header: "Joylashuv",
      className: "hidden lg:table-cell",
      cell: (product) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {product.location}
        </span>
      ),
    },
    {
      header: "Ta'minotchi",
      className: "hidden xl:table-cell",
      cell: (product) => (
        <span className="text-sm text-slate-600">{product.supplier}</span>
      ),
    },
    {
      header: "Qoldiq",
      align: "right",
      cell: (product) => {
        const isLow = product.quantity <= product.minQuantity;
        const isEmpty = product.quantity === 0;
        return (
          <div className="text-right">
            <p className={`text-sm font-semibold ${isEmpty ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-900'}`}>
              {formatNumber(product.quantity)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              min: {formatNumber(product.minQuantity)}
            </p>
          </div>
        );
      },
    },
    {
      header: "Narx",
      align: "right",
      className: "hidden md:table-cell",
      cell: (product) => (
        <span className="text-sm font-medium text-slate-900">
          {formatCurrency(product.price)}
        </span>
      ),
    },
    {
      header: "Jami qiymat",
      align: "right",
      className: "hidden lg:table-cell",
      cell: (product) => (
        <span className="text-sm font-semibold text-slate-700">
          {formatCurrency(product.price * product.quantity)}
        </span>
      ),
    },
    {
      header: "Holat",
      className: "hidden sm:table-cell",
      cell: (product) => {
        if (product.quantity === 0) {
          return <StatusBadge label="Tugagan" tone="red" />;
        }
        if (product.quantity <= product.minQuantity) {
          return <StatusBadge label="Tanqis" tone="amber" />;
        }
        return <StatusBadge label="Yetarli" tone="green" />;
      },
    },
    {
      header: "",
      align: "right",
      cell: (product) => (
        <RowActions
          onView={() => setViewing(product)}
          onEdit={() => openEdit(product)}
          onDelete={() => setDeleting(product)}
        >
          {productMenuItems(product)}
        </RowActions>
      ),
    },
  ];

  const lowStockCount = stats?.lowStock ?? 0;

  return (
    <>
      <PageHeader
        title="Ombor Boshqaruvi"
        description="Mahsulotlar, qoldiqlar va ta'minotchilarni professional boshqarish tizimi."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b] shadow-md"
        >
          <Plus size={18} /> Yangi mahsulot qo'shish
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={Boxes}
          value={stats ? formatNumber(stats.totalProducts) : "—"}
          label="Mahsulot nomi"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.normalStock) : "—"}
          label="Me'yordagi qoldiq"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.lowStock) : "—"}
          label="Tanqis mahsulot"
          tone="warning"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.warehouseValue) : "—"}
          label="Ombor qiymati (so'm)"
          isLoading={statsLoading}
        />
      </section>

      {lowStockCount > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#efdfc5] bg-[#fffaf3] p-4">
          <AlertTriangle className="shrink-0 text-[#d5943c]" size={20} />
          <p className="text-sm text-slate-600">
            <b className="text-slate-700">E'tibor:</b> {lowStockCount} mahsulot
            minimal qoldiqdan past. Xarid buyurtmasini yaratish tavsiya etiladi.
          </p>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                setLowStockOnly(true);
                setPage(1);
              }}
              className="whitespace-nowrap text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              Ko'rish
            </button>
            <button
              onClick={() => setRestockOpen(true)}
              disabled={restock.isPending}
              className="whitespace-nowrap text-sm font-bold text-[#b76d1d] hover:text-[#8f5514] disabled:opacity-50"
            >
              {restock.isPending ? "Yuborilmoqda..." : "Buyurtma berish"}
            </button>
          </div>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Qoldiqlar</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Nomi, kategoriya, ta'minotchi"
            />
            <Select value={category} onValueChange={withPageReset(setCategory)}>
              <SelectTrigger
                className="w-[160px]"
                aria-label="Kategoriya bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha kategoriya</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={withPageReset(setLocation)}>
              <SelectTrigger
                className="w-[150px]"
                aria-label="Ombor bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha omborlar</SelectItem>
                {locations.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => {
                setLowStockOnly(!lowStockOnly);
                setPage(1);
              }}
              aria-pressed={lowStockOnly}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                lowStockOnly
                  ? "border-[#e8c99b] bg-[#fff5ea] text-[#b5761f]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Faqat tanqis
            </button>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            {view === "table" ? (
              <DataTable
                columns={columns}
                rows={products}
                rowKey={(product) => product.id}
                isLoading={isLoading}
                emptyText="Mos mahsulot topilmadi."
                minWidth={860}
              />
            ) : (
              <CardGrid
                rows={products}
                rowKey={(product) => product.id}
                isLoading={isLoading}
                emptyText="Mos mahsulot topilmadi."
                renderCard={(product) => {
                  const low = product.quantity <= product.minQuantity;
                  const empty = product.quantity === 0;
                  return (
                    <div className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:border-[#173f38]/20">
                      {/* Product Icon/Image Placeholder */}
                      <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-[#e9f5ef] group-hover:to-[#d4ebe0] transition-all">
                        <Boxes size={40} className="text-slate-300 group-hover:text-[#378166] transition-colors" />
                      </div>

                      {/* Product Name & Category */}
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            setHistoryProduct(product);
                            setShowHistoryDialog(true);
                          }}
                          className="text-left hover:text-[#173f38] transition-colors"
                        >
                          <p className="truncate text-base font-bold text-slate-900 hover:underline group-hover:text-[#173f38] transition-colors">
                            {product.name}
                          </p>
                        </button>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {product.category}
                        </p>
                      </div>

                      {/* Status & Location */}
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <StatusBadge
                          label={empty ? "Tugagan" : low ? "Tanqis" : "Me'yorda"}
                          tone={empty ? "red" : low ? "amber" : "green"}
                        />
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {product.location}
                        </span>
                      </div>

                      {/* Stock Info - Prominent */}
                      <div className={`mb-4 rounded-lg border-2 p-3 ${
                        empty ? 'border-red-200 bg-red-50' :
                        low ? 'border-orange-200 bg-orange-50' : 
                        'border-green-200 bg-green-50'
                      }`}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-medium text-slate-600">
                            Qoldiq:
                          </span>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${
                              empty ? 'text-red-600' : 
                              low ? 'text-orange-600' : 
                              'text-green-600'
                            }`}>
                              {formatNumber(product.quantity)}
                            </p>
                            <p className="text-xs text-slate-500">
                              min: {formatNumber(product.minQuantity)} dona
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <dl className="mt-auto space-y-2 border-t border-slate-100 pt-4 text-sm">
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-500">Narx:</dt>
                          <dd className="font-bold text-slate-900">
                            {formatCurrency(product.price)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-500">Jami qiymat:</dt>
                          <dd className="font-bold text-[#173f38]">
                            {formatCurrency(product.price * product.quantity)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-slate-500">Ta'minotchi:</dt>
                          <dd className="truncate text-slate-700 font-medium">
                            {product.supplier}
                          </dd>
                        </div>
                      </dl>

                      {/* Actions */}
                      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewing(product)}
                          className="flex-1 text-xs"
                        >
                          Ko'rish
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(product)}
                          className="flex-1 text-xs bg-[#173f38] text-white hover:bg-[#0f312b] hover:text-white"
                        >
                          Tahrirlash
                        </Button>
                        <RowActions
                          onView={() => setViewing(product)}
                          onEdit={() => openEdit(product)}
                          onDelete={() => setDeleting(product)}
                        >
                          {productMenuItems(product)}
                        </RowActions>
                      </div>
                    </div>
                  );
                }}
              />
            )}
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="mahsulot"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h3 className="font-bold text-slate-800">Ombor harakatlari</h3>
          <p className="mt-1 text-sm text-slate-400">
            Qoldiq nega o'zgargani — buyurtma, xarid va qo'lda tuzatishlar
            tarixi
          </p>
        </div>

        {movementsLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">
            Hozircha harakat qayd etilmagan.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {movements.map((movement) => {
              const incoming = movement.type === "in";
              return (
                <div
                  key={movement.id}
                  className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      movement.type === "adjustment"
                        ? "bg-slate-100 text-slate-500"
                        : incoming
                          ? "bg-[#e9f5ef] text-[#378166]"
                          : "bg-[#fff3e7] text-[#cc8537]"
                    }`}
                  >
                    {movement.type === "adjustment" ? (
                      <SlidersHorizontal size={15} />
                    ) : incoming ? (
                      <ArrowDownToLine size={16} />
                    ) : (
                      <ArrowUpFromLine size={16} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {movement.productName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {movement.reason} · {movement.reference}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-bold ${
                        incoming ? "text-[#2d8068]" : "text-slate-700"
                      }`}
                    >
                      {incoming ? "+" : "−"}
                      {formatNumber(movement.quantity)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      qoldiq: {formatNumber(movement.balanceAfter)}
                    </p>
                  </div>
                  <span className="hidden w-24 shrink-0 text-right text-xs text-slate-400 sm:block">
                    {formatDate(movement.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
      />

      <StockAdjustDialog
        open={Boolean(adjusting)}
        onOpenChange={(open) => !open && setAdjusting(null)}
        product={adjusting}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.category}
        badges={
          viewing && (
            <StatusBadge
              label={
                viewing.quantity <= viewing.minQuantity ? "Tanqis" : "Me'yorda"
              }
              tone={viewing.quantity <= viewing.minQuantity ? "amber" : "green"}
            />
          )
        }
        sections={
          viewing
            ? [
                {
                  title: "Qoldiq",
                  fields: [
                    {
                      label: "Ombordagi soni",
                      value: `${formatNumber(viewing.quantity)} dona`,
                    },
                    {
                      label: "Minimal chegara",
                      value: `${formatNumber(viewing.minQuantity)} dona`,
                    },
                    { label: "Narx", value: formatCurrency(viewing.price) },
                    {
                      label: "Umumiy qiymat",
                      value: (
                        <span className="font-bold text-slate-900">
                          {formatCurrency(viewing.price * viewing.quantity)}
                        </span>
                      ),
                    },
                  ],
                },
                {
                  title: "Joylashuv",
                  fields: [
                    { label: "Ombor", value: viewing.location },
                    { label: "Ta'minotchi", value: viewing.supplier },
                  ],
                },
              ]
            : []
        }
        actions={
          viewing && (
            <Button
              variant="outline"
              onClick={() => {
                const product = viewing;
                setViewing(null);
                setAdjusting(product);
              }}
            >
              Qoldiqni tuzatish
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Mahsulotni o'chirish"
        description={
          <>
            <b>{deleting?.name}</b> katalogdan butunlay o'chiriladi. Bu amalni
            qaytarib bo'lmaydi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={restockOpen}
        onOpenChange={setRestockOpen}
        title="Xarid buyurtmasini yaratish"
        description={
          <>
            Tanqis qoldiqli {lowStockCount} ta mahsulot minimal chegaraning ikki
            barobarigacha to'ldiriladi.
          </>
        }
        confirmText="Buyurtma berish"
        onConfirm={handleRestock}
      />

      {/* Product Sales History Dialog */}
      {historyProduct && (
        <ProductSalesHistoryDialog
          open={showHistoryDialog}
          onClose={() => {
            setShowHistoryDialog(false);
            setHistoryProduct(null);
          }}
          productName={historyProduct.name}
          productCategory={historyProduct.category}
          sales={
            allOrders
              .filter((order) =>
                order.items?.some((item) => item.productId === historyProduct.id)
              )
              .map((order) => {
                const orderItem = order.items?.find(
                  (item) => item.productId === historyProduct.id
                );
                const customer = allCustomers.find(
                  (c) => c.id === order.customerId
                );
                return {
                  orderNumber: order.orderNumber,
                  orderDate: order.orderDate,
                  quantity: orderItem?.quantity || 0,
                  price: orderItem?.price || 0,
                  total: (orderItem?.quantity || 0) * (orderItem?.price || 0),
                  customerName: customer?.name || "Noma'lum",
                };
              })
          }
        />
      )}
    </>
  );
}
