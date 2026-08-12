import { useState } from "react";
import { PackageX, Plus, RotateCcw, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Supplier } from "@shared/api";
import {
  CardGrid,
  Column,
  DataTable,
  TablePagination,
} from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DetailDialog } from "@/components/DetailDialog";
import { SupplierDialog } from "@/components/SupplierDialog";
import { ProductReturnDialog } from "@/components/ProductReturnDialog";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteSupplier,
  useProducts,
  useSupplierCategories,
  useSupplierStats,
  useSuppliers,
  useUpdateSupplier,
} from "@/hooks/use-api";
import { useDebounced } from "@/hooks/use-debounced";
import { formatNumber, formatUzPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

const ALL = "__all__";

/** Ta'minotchi bahosi — yulduzchalar bilan. */
function Rating({ value }: { value: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`Baho: ${value} / 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          aria-hidden
          className={cn(
            star <= value ? "fill-[#e0a944] text-[#e0a944]" : "text-slate-200",
          )}
        />
      ))}
    </span>
  );
}

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<ViewMode>("table");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [restoring, setRestoring] = useState<Supplier | null>(null);
  const [returningProduct, setReturningProduct] = useState<Supplier | null>(null);

  const debouncedSearch = useDebounced(search);

  const { data: statsData, isLoading: statsLoading } = useSupplierStats();
  const { data: categoriesData } = useSupplierCategories();
  const { data: productsData } = useProducts({ page: 1, limit: 1000 }); // Barcha mahsulotlar
  const { data, isLoading, isError, error, refetch } = useSuppliers({
    page,
    limit: 10,
    search: debouncedSearch,
    category: category === ALL ? undefined : category,
    status: status === ALL ? undefined : (status as Supplier["status"]),
  });
  const deleteSupplier = useDeleteSupplier();
  const updateSupplier = useUpdateSupplier();

  const stats = statsData?.data;
  const suppliers = data?.data ?? [];
  const pagination = data?.pagination;
  const categories = categoriesData?.data ?? [];
  const products = productsData?.data ?? [];

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  // Xato bo'lsa ConfirmDialog uni ushlab, xabar ko'rsatadi va oynani ochiq qoldiradi.
  const handleDelete = async () => {
    if (!deleting) return;
    await deleteSupplier.mutateAsync(deleting.id);
    toast.success(`${deleting.name} kartotekadan o'chirildi`);
  };

  const handleRestore = async () => {
    if (!restoring) return;
    await updateSupplier.mutateAsync({
      id: restoring.id,
      status: "active",
    });
    toast.success(`${restoring.name} faollashtirилди`);
    setRestoring(null);
  };

  const handleProductReturn = async (data: {
    productId: string;
    quantity: number;
    reason: string;
    note: string;
  }) => {
    if (!returningProduct) return;
    
    // Bu yerda backend'ga so'rov yuboriladi
    // Hozircha faqat toast ko'rsatamiz
    const product = products.find(p => p.id === data.productId);
    const reasonLabels: Record<string, string> = {
      defective: "Nuqsonli mahsulot",
      wrong_item: "Noto'g'ri mahsulot",
      damaged: "Shikastlangan",
      quality: "Sifat muammosi",
      expired: "Muddati o'tgan",
      other: "Boshqa sabab",
    };
    
    toast.success(
      `${returningProduct.name}ga "${product?.name}" (${data.quantity} ta) qaytarildi. Sabab: ${reasonLabels[data.reason]}`
    );
    
    // Real implementatsiyada:
    // await returnProductToSupplier.mutateAsync({
    //   supplierId: returningProduct.id,
    //   ...data
    // });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setDialogOpen(true);
  };

  const columns: Column<Supplier>[] = [
    {
      header: "Ta'minotchi",
      cell: (supplier) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf4f1] text-[#327f6a]">
            <Truck size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700">
              {supplier.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {supplier.category}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Tovarlar soni",
      cell: (supplier) => {
        const count = products.filter(p => p.supplier === supplier.name && !p.deletedAt).length;
        return (
          <div className="text-sm">
            <span className="font-semibold text-slate-700">{count} ta</span>
            <span className="ml-1 text-slate-400">tovar</span>
          </div>
        );
      },
    },
    {
      header: "Aloqa shaxsi",
      className: "hidden lg:table-cell",
      cell: (supplier) => (
        <div>
          <p className="text-sm text-slate-600">
            {supplier.contactPerson || "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatUzPhone(supplier.phone) || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Manzil",
      className: "hidden xl:table-cell",
      cell: (supplier) => (
        <span className="text-sm text-slate-500">
          {supplier.address || "—"}
        </span>
      ),
    },
    {
      header: "Baho",
      cell: (supplier) => <Rating value={supplier.rating} />,
    },
    {
      header: "Holati",
      cell: (supplier) => (
        <StatusBadge
          label={supplier.status === "active" ? "Faol" : "Arxivda"}
          tone={supplier.status === "active" ? "green" : "slate"}
        />
      ),
    },
    {
      header: "",
      align: "right",
      cell: (supplier) => {
        const hasProducts = products.filter(
          p => p.supplier === supplier.name && !p.deletedAt && p.quantity > 0
        ).length > 0;

        return (
          <RowActions
            onView={() => setViewing(supplier)}
            onEdit={supplier.status === "active" ? () => openEdit(supplier) : undefined}
            onDelete={supplier.status === "active" ? () => setDeleting(supplier) : undefined}
            onReturn={supplier.status === "inactive" ? () => setRestoring(supplier) : undefined}
            returnText="Qaytarish"
          >
            {supplier.status === "active" && hasProducts && (
              <>
                <DropdownMenuItem
                  onSelect={() => setReturningProduct(supplier)}
                  className="gap-2"
                >
                  <PackageX size={15} className="text-[#cb8535]" />
                  Mahsulotni qaytarish
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
          </RowActions>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Ta'minotchilar"
        description="Yetkazib beruvchilar kartotekasi — ombordagi mahsulotlarga bog'lanadi."
      >
        <Button
          onClick={openCreate}
          className="bg-[#173f38] hover:bg-[#0f312b]"
        >
          <Plus size={16} /> Yangi ta'minotchi
        </Button>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <HeroStat
          icon={Truck}
          value={stats ? formatNumber(stats.totalSuppliers) : "—"}
          label="Jami ta'minotchi"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.activeSuppliers) : "—"}
          label="Faol ta'minotchi"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? formatNumber(stats.categories) : "—"}
          label="Kategoriya"
          isLoading={statsLoading}
        />
        <StatTile
          value={stats ? `${stats.averageRating} / 5` : "—"}
          label="O'rtacha baho"
          isLoading={statsLoading}
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-bold text-slate-800">
              Ta'minotchilar ro'yxati
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {pagination ? `${pagination.total} ta yozuv` : "Yuklanmoqda..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Nomi, aloqa shaxsi, kategoriya"
            />
            <Select value={category} onValueChange={withPageReset(setCategory)}>
              <SelectTrigger
                className="w-[180px]"
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
            <Select value={status} onValueChange={withPageReset(setStatus)}>
              <SelectTrigger
                className="w-[140px]"
                aria-label="Holat bo'yicha filtr"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Barcha holatlar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="inactive">Arxivda</SelectItem>
              </SelectContent>
            </Select>
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
                rows={suppliers}
                rowKey={(supplier) => supplier.id}
                isLoading={isLoading}
                emptyText="Mos ta'minotchi topilmadi."
                minWidth={860}
              />
            ) : (
              <CardGrid
                rows={suppliers}
                rowKey={(supplier) => supplier.id}
                isLoading={isLoading}
                emptyText="Mos ta'minotchi topilmadi."
                renderCard={(supplier) => {
                  const productCount = products.filter(
                    p => p.supplier === supplier.name && !p.deletedAt
                  ).length;
                  
                  return (
                  <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf4f1] text-[#327f6a]">
                          <Truck size={20} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-700">
                            {supplier.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {supplier.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <ViewButton onClick={() => setViewing(supplier)} />
                        <RowActions
                          onView={() => setViewing(supplier)}
                          onEdit={supplier.status === "active" ? () => openEdit(supplier) : undefined}
                          onDelete={supplier.status === "active" ? () => setDeleting(supplier) : undefined}
                          onReturn={supplier.status === "inactive" ? () => setRestoring(supplier) : undefined}
                          returnText="Qaytarish"
                        >
                          {supplier.status === "active" && productCount > 0 && (
                            <>
                              <DropdownMenuItem
                                onSelect={() => setReturningProduct(supplier)}
                                className="gap-2"
                              >
                                <PackageX size={15} className="text-[#cb8535]" />
                                Mahsulotni qaytarish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                        </RowActions>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <StatusBadge
                        label={
                          supplier.status === "active" ? "Faol" : "Arxivda"
                        }
                        tone={supplier.status === "active" ? "green" : "slate"}
                      />
                      <Rating value={supplier.rating} />
                    </div>
                    <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Tovarlar</dt>
                        <dd className="font-semibold text-slate-700">
                          {productCount} ta
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Aloqa shaxsi</dt>
                        <dd className="truncate text-slate-600">
                          {supplier.contactPerson || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Telefon</dt>
                        <dd className="text-slate-600">
                          {formatUzPhone(supplier.phone) || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-400">Manzil</dt>
                        <dd className="truncate text-slate-600">
                          {supplier.address || "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );}}
              />
            )}
            {pagination && !isLoading && (
              <TablePagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                itemLabel="ta'minotchi"
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editing}
        categories={categories}
      />

      <DetailDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing?.name ?? ""}
        subtitle={viewing?.category}
        badges={
          viewing && (
            <>
              <StatusBadge
                label={viewing.status === "active" ? "Faol" : "Arxivda"}
                tone={viewing.status === "active" ? "green" : "slate"}
              />
              <Rating value={viewing.rating} />
            </>
          )
        }
        sections={
          viewing
            ? [
                {
                  title: "Aloqa",
                  fields: [
                    { label: "Aloqa shaxsi", value: viewing.contactPerson },
                    { label: "Telefon", value: formatUzPhone(viewing.phone) },
                    { label: "Email", value: viewing.email, full: true },
                  ],
                },
                {
                  title: "Qo'shimcha",
                  fields: [
                    { label: "Kategoriya", value: viewing.category },
                    { label: "Baho", value: `${viewing.rating} / 5` },
                    { label: "Manzil", value: viewing.address, full: true },
                  ],
                },
                {
                  title: "Tovarlar",
                  fields: (() => {
                    const supplierProducts = products.filter(
                      p => p.supplier === viewing.name && !p.deletedAt
                    );
                    
                    if (supplierProducts.length === 0) {
                      return [{ label: "", value: "Hech qanday tovar topilmadi", full: true }];
                    }
                    
                    return supplierProducts.slice(0, 5).map(p => ({
                      label: p.name,
                      value: `${p.quantity} ta - ${formatNumber(p.price)} so'm`,
                      full: true
                    })).concat(
                      supplierProducts.length > 5 
                        ? [{ label: "", value: `va yana ${supplierProducts.length - 5} ta tovar...`, full: true }]
                        : []
                    );
                  })(),
                },
              ]
            : []
        }
        actions={
          viewing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewing(null)}
              >
                Qaytish
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const supplier = viewing;
                  setViewing(null);
                  openEdit(supplier);
                }}
              >
                Tahrirlash
              </Button>
            </div>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Ta'minotchini o'chirish"
        description={
          <>
            <b>{deleting?.name}</b> kartotekadan o'chiriladi. Mahsuloti
            bog'langan ta'minotchini o'chirib bo'lmaydi.
          </>
        }
        confirmText="O'chirish"
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(restoring)}
        onOpenChange={(open) => !open && setRestoring(null)}
        title="Ta'minotchini qaytarish"
        description={
          <>
            <b>{restoring?.name}</b> faollashtirilib, qayta ishlatish uchun
            tayyorlanadi.
          </>
        }
        confirmText="Qaytarish"
        onConfirm={handleRestore}
      />

      <ProductReturnDialog
        open={Boolean(returningProduct)}
        onOpenChange={(open) => !open && setReturningProduct(null)}
        supplier={returningProduct}
        products={products}
        onSubmit={handleProductReturn}
      />
    </>
  );
}
