import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentStatus, Purchase, PurchaseStatus } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, TextField } from "@/components/FormField";
import {
  useCreatePurchase,
  useEmployees,
  useProducts,
  useSuppliers,
  useUpdatePurchase,
} from "@/hooks/use-api";
import { formatCurrency, groupDigits, todayISO } from "@/lib/format";

export const PURCHASE_STATUS_OPTIONS: {
  value: PurchaseStatus;
  label: string;
}[] = [
  { value: "draft", label: "Qoralama" },
  { value: "ordered", label: "Buyurtma berilgan" },
  { value: "received", label: "Qabul qilingan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

export const PURCHASE_PAYMENT_OPTIONS: {
  value: PaymentStatus;
  label: string;
}[] = [
  { value: "unpaid", label: "To'lanmagan" },
  { value: "partial", label: "Qisman to'langan" },
  { value: "paid", label: "To'langan" },
];

/** Formadagi bitta qator — miqdor va tannarx matn sifatida saqlanadi. */
interface ItemRow {
  productId: string;
  quantity: string;
  cost: string;
}

const EMPTY_ROW: ItemRow = { productId: "", quantity: "1", cost: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  purchase?: Purchase | null;
}

export function PurchaseDialog({ open, onOpenChange, purchase }: Props) {
  const [form, setForm] = useState({
    supplierId: "",
    expectedDate: "",
    createdBy: "",
    note: "",
    status: "draft" as PurchaseStatus,
    paymentStatus: "unpaid" as PaymentStatus,
  });
  const [rows, setRows] = useState<ItemRow[]>([EMPTY_ROW]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const { data: suppliersData } = useSuppliers({
    limit: 200,
    status: "active",
  });
  const { data: productsData } = useProducts({ limit: 200 });
  const { data: employeesData } = useEmployees({ limit: 100 });

  const suppliers = suppliersData?.data ?? [];
  const products = productsData?.data ?? [];
  const employees = employeesData?.data ?? [];

  const isEdit = Boolean(purchase);
  const isPending = createPurchase.isPending || updatePurchase.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (purchase) {
      setForm({
        supplierId: purchase.supplierId,
        expectedDate: purchase.expectedDate,
        createdBy: purchase.createdBy,
        note: purchase.note,
        status: purchase.status,
        paymentStatus: purchase.paymentStatus,
      });
      setRows(
        purchase.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
          cost: item.cost.toString(),
        })),
      );
    } else {
      setForm({
        supplierId: "",
        expectedDate: "",
        createdBy: "",
        note: "",
        status: "draft",
        paymentStatus: "unpaid",
      });
      setRows([EMPTY_ROW]);
    }
  }, [open, purchase]);

  /** Tannarx kiritilmagan bo'lsa sotish narxining 70% i taklif qilinadi. */
  const defaultCost = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    return product ? Math.round(product.price * 0.7) : 0;
  };

  const costOf = (row: ItemRow) =>
    row.cost ? Number(row.cost) : defaultCost(row.productId);

  const lineTotal = (row: ItemRow) => costOf(row) * (Number(row.quantity) || 0);
  const total = rows.reduce((sum, row) => sum + lineTotal(row), 0);

  const updateRow = (index: number, patch: Partial<ItemRow>) => {
    setRows((previous) =>
      previous.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.supplierId) next.supplierId = "Ta'minotchi tanlanishi shart";
    if (!form.expectedDate)
      next.expectedDate = "Kutilayotgan sana tanlanishi shart";
    if (!form.createdBy) next.createdBy = "Mas'ul xodim tanlanishi shart";

    const filled = rows.filter((row) => row.productId);
    if (filled.length === 0)
      next.items = "Kamida bitta mahsulot qo'shilishi kerak";
    else if (filled.some((row) => (Number(row.quantity) || 0) <= 0))
      next.items = "Har bir qator uchun miqdor noldan katta bo'lishi kerak";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const items = rows
      .filter((row) => row.productId)
      .map((row) => ({
        productId: row.productId,
        quantity: Number(row.quantity),
        cost: costOf(row),
      }));

    const payload = {
      supplierId: form.supplierId,
      items,
      expectedDate: form.expectedDate,
      createdBy: form.createdBy,
      note: form.note.trim(),
    };

    try {
      if (purchase) {
        await updatePurchase.mutateAsync({
          id: purchase.id,
          ...payload,
          status: form.status,
          paymentStatus: form.paymentStatus,
        });
        toast.success("Xarid buyurtmasi yangilandi");
      } else {
        await createPurchase.mutateAsync({ ...payload, status: form.status });
        toast.success("Xarid buyurtmasi yaratildi");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Xarid ${purchase?.purchaseNumber}`
              : "Yangi xarid buyurtmasi"}
          </DialogTitle>
          <DialogDescription>
            "Qabul qilingan" holatiga o'tkazilganda ombor qoldig'i oshadi,
            to'lov yakunlanganda moliyaga xarajat yoziladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Field
            id="purchase-supplier"
            label="Ta'minotchi"
            required
            error={errors.supplierId}
          >
            <Select
              value={form.supplierId || undefined}
              onValueChange={(value) => setForm({ ...form, supplierId: value })}
            >
              <SelectTrigger
                id="purchase-supplier"
                aria-invalid={Boolean(errors.supplierId)}
              >
                <SelectValue placeholder="Ta'minotchini tanlang" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Mahsulotlar <span className="text-red-500">*</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows([...rows, { ...EMPTY_ROW }])}
              >
                <Plus size={14} /> Qator qo'shish
              </Button>
            </div>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <Select
                        value={row.productId || undefined}
                        onValueChange={(value) =>
                          updateRow(index, {
                            productId: value,
                            // Mahsulot almashsa taklif qilingan tannarx ham yangilanadi.
                            cost: defaultCost(value).toString(),
                          })
                        }
                      >
                        <SelectTrigger
                          aria-label={`${index + 1}-qator mahsuloti`}
                        >
                          <SelectValue placeholder="Mahsulotni tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      inputMode="numeric"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(index, {
                          quantity: event.target.value.replace(/\D/g, ""),
                        })
                      }
                      aria-label={`${index + 1}-qator miqdori`}
                      className="w-16 shrink-0 text-center"
                    />
                    <Input
                      inputMode="numeric"
                      value={groupDigits(row.cost)}
                      onChange={(event) =>
                        updateRow(index, {
                          cost: event.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="tannarx"
                      aria-label={`${index + 1}-qator tannarxi`}
                      className="w-32 shrink-0 text-right"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRows(rows.filter((_, i) => i !== index))
                      }
                      disabled={rows.length === 1}
                      aria-label={`${index + 1}-qatorni o'chirish`}
                      className="mt-1.5 shrink-0 rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {row.productId && (
                    <p className="mt-2 px-0.5 text-right text-xs font-semibold text-slate-600">
                      {formatCurrency(lineTotal(row))}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {errors.items && (
              <p className="mt-1.5 text-xs text-red-600">{errors.items}</p>
            )}

            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
              <span className="text-sm font-medium text-slate-600">Jami</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="purchase-expected"
              label="Kutilayotgan sana"
              required
              type="date"
              min={todayISO()}
              value={form.expectedDate}
              error={errors.expectedDate}
              onChange={(value) => setForm({ ...form, expectedDate: value })}
            />

            <Field
              id="purchase-owner"
              label="Mas'ul"
              required
              error={errors.createdBy}
            >
              <Select
                value={form.createdBy || undefined}
                onValueChange={(value) =>
                  setForm({ ...form, createdBy: value })
                }
              >
                <SelectTrigger
                  id="purchase-owner"
                  aria-invalid={Boolean(errors.createdBy)}
                >
                  <SelectValue placeholder="Xodimni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="purchase-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as PurchaseStatus })
                }
              >
                <SelectTrigger id="purchase-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {isEdit && (
              <Field id="purchase-payment" label="To'lov holati">
                <Select
                  value={form.paymentStatus}
                  onValueChange={(value) =>
                    setForm({ ...form, paymentStatus: value as PaymentStatus })
                  }
                >
                  <SelectTrigger id="purchase-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_PAYMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field id="purchase-note" label="Izoh">
            <Textarea
              id="purchase-note"
              value={form.note}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value })
              }
              placeholder="Yetkazish shartlari, qo'shimcha talablar"
              rows={2}
            />
          </Field>

          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#173f38] hover:bg-[#0f312b]"
            >
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
