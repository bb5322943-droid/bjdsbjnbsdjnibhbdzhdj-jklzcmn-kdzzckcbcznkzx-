import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Package, Warehouse as WarehouseIcon, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ProductDialog } from "@/components/ProductDialog";
import { StockAdjustDialog } from "@/components/StockAdjustDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { WarehouseLocationDialog } from "@/components/WarehouseLocationDialog";
import {
  ErrorState,
  PageHeader,
  RowActions,
  SearchInput,
  StatusBadge,
  HeroStat,
  StatTile,
} from "@/components/PageKit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBranches,
  useProducts,
  useDeleteProduct,
  useDeleteBranch,
} from "@/hooks/use-api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Product } from "@shared/api";
import { useDebounced } from "@/hooks/use-debounced";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";

export default function WarehouseDetail() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState(false);

  const debouncedSearch = useDebounced(search);

  // Ombor ma'lumotlarini olish
  const { data: warehousesData, isLoading: warehouseLoading } = useBranches({ limit: 100 });
  const warehouse = warehousesData?.data?.find((b) => b.id === warehouseId && b.note === "warehouse");

  // Agar ombor topilmasa
  if (!warehouseLoading && !warehouse) {
    return (
      <div className="p-8">
        <ErrorState
          message="Ombor topilmadi"
          onRetry={() => navigate("/warehouse")}
        />
      </div>
    );
  }

  // Ombordagi mahsulotlarni olish
  const { data, isLoading, isError, error, refetch } = useProducts({
    page,
    limit: 10,
    search: debouncedSearch,
    location: warehouse?.name,
  });

  const deleteProduct = useDeleteProduct();
  const deleteBranch = useDeleteBranch();

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteProduct.mutateAsync(deleting.id);
    toast.success(`${deleting.name} omborlardan o'chirildi`);
  };

  const handleDeleteWarehouse = async () => {
    if (!warehouse) return;
    
    // Agar mahsulotlar bo'lsa, ogohlantirish
    if (products.length > 0) {
      toast.error(`Ushbu omborda ${products.length} ta mahsulot mavjud. Avval mahsulotlarni ko'chiring yoki o'chiring.`);
      setDeletingWarehouse(false);
      return;
    }
    
    await deleteBranch.mutateAsync(warehouse.id);
    toast.success(`${warehouse.name} ombordan o'chirildi`);
    navigate("/warehouse");
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setDialogOpen(true);
  };

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
          <p className="truncate text-sm font-medium text-slate-900">
            {product.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {product.category}
          </p>
        </div>
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

  // Statistika hisoblash
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;

  if (warehouseLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!warehouse) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/warehouse")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft size={18} />
            </Button>
            <WarehouseIcon size={24} className="text-[#2b8169]" />
            <span>{warehouse.name}</span>
          </div>
        }
        description={`${warehouse.region} · ${warehouse.address || "Manzil ko'rsatilmagan"}`}
      >
        <div className="flex gap-2">
          <Button
            onClick={() => setWarehouseDialogOpen(true)}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Edit size={16} /> Tahrirlash
          </Button>
          <Button
            onClick={() => setDeletingWarehouse(true)}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} /> O'chirish
          </Button>
          <Button
            onClick={openCreate}
            className="bg-[#173f38] hover:bg-[#0f312b]"
          >
            <Plus size={16} /> Mahsulot qo'shish
          </Button>
        </div>
      </PageHeader>

      {/* Statistika */}
      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={Package}
          value={formatNumber(totalProducts)}
          label="Mahsulot nomi"
          isLoading={isLoading}
        />
        <StatTile
          value={formatNumber(totalProducts - lowStockCount)}
          label="Me'yordagi qoldiq"
          isLoading={isLoading}
        />
        <StatTile
          value={formatNumber(lowStockCount)}
          label="Tanqis mahsulot"
          tone="warning"
          isLoading={isLoading}
        />
        <StatTile
          value={formatCurrency(totalValue)}
          label="Ombor qiymati"
          isLoading={isLoading}
        />
      </section>

      {/* Ma'lumotlar */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">Mahsulotlar</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Nomi, kategoriya"
            />
          </div>
        </div>

        {isError ? (
          <ErrorState message={error?.message} onRetry={() => refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={products}
              rowKey={(product) => product.id}
              isLoading={isLoading}
              emptyText="Ushbu omborda mahsulot topilmadi."
              minWidth={860}
            />
            {pagination && !isLoading && pagination.total > 0 && (
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

      {/* Dialoglar */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        defaultLocation={warehouse?.name}
      />

      <StockAdjustDialog
        open={Boolean(adjusting)}
        onOpenChange={(open) => !open && setAdjusting(null)}
        product={adjusting}
      />

      {viewing && (
        <DetailDialog
          open={Boolean(viewing)}
          onOpenChange={(open) => !open && setViewing(null)}
          title={viewing.name}
          subtitle={viewing.category}
          badges={
            <StatusBadge
              label={
                viewing.quantity <= viewing.minQuantity ? "Tanqis" : "Me'yorda"
              }
              tone={viewing.quantity <= viewing.minQuantity ? "amber" : "green"}
            />
          }
          sections={[
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
          ]}
          actions={
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
          }
        />
      )}

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
        open={deletingWarehouse}
        onOpenChange={setDeletingWarehouse}
        title="Omborni o'chirish"
        description={
          <>
            <b>{warehouse?.name}</b> omborini o'chirmoqchimisiz? Bu amalni
            qaytarib bo'lmaydi.
            {products.length > 0 && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <strong>Ogohlantirish:</strong> Ushbu omborda {products.length} ta mahsulot mavjud. 
                Avval barcha mahsulotlarni boshqa omborga ko'chiring yoki o'chiring.
              </div>
            )}
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDeleteWarehouse}
      />

      <WarehouseLocationDialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        location={warehouse || null}
      />
    </>
  );
}
