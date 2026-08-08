import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Order, OrderStatus, PaymentStatus } from "@shared/api";
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
  useCreateOrder,
  useCustomers,
  useEmployees,
  useProducts,
  useUpdateOrder,
} from "@/hooks/use-api";
import { formatCurrency, formatNumber, todayISO } from "@/lib/format";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "draft", label: "Qoralama" },
  { value: "confirmed", label: "Tasdiqlangan" },
  { value: "shipped", label: "Jo'natilgan" },
  { value: "delivered", label: "Yetkazilgan" },
  { value: "cancelled", label: "Bekor qilingan" },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] =
  [
    { value: "unpaid", label: "To'lanmagan" },
    { value: "partial", label: "Qisman to'langan" },
    { value: "paid", label: "To'langan" },
  ];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Naqd pul" },
  { value: "card", label: "Plastik karta" },
  { value: "terminal", label: "Terminal" },
  { value: "mixed", label: "Aralash" },
];

/** Formadagi bitta qator. Miqdor matn sifatida saqlanadi — kiritish paytida bo'sh bo'lishi mumkin. */
interface ItemRow {
  productId: string;
  quantity: string;
}

const EMPTY_ROW: ItemRow = { productId: "", quantity: "1" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  order?: Order | null;
}

export function OrderDialog({ open, onOpenChange, order }: Props) {
  const [form, setForm] = useState({
    customerId: "",
    deliveryDate: "",
    assignedTo: "",
    note: "",
    status: "draft" as OrderStatus,
    paymentStatus: "unpaid" as PaymentStatus,
  });
  const [rows, setRows] = useState<ItemRow[]>([EMPTY_ROW]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");

  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: customersData } = useCustomers({
    limit: 200,
    status: "active",
  });
  const { data: productsData } = useProducts({ limit: 200 });
  const { data: employeesData } = useEmployees({ limit: 100 });

  const customers = customersData?.data ?? [];
  const products = productsData?.data ?? [];
  const employees = employeesData?.data ?? [];

  const isEdit = Boolean(order);
  const isPending = createOrder.isPending || updateOrder.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (order) {
      setForm({
        customerId: order.customerId,
        deliveryDate: order.deliveryDate,
        assignedTo: order.assignedTo,
        note: order.note,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
      setRows(
        order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
        })),
      );
    } else {
      setForm({
        customerId: "",
        deliveryDate: "",
        assignedTo: "",
        note: "",
        status: "draft",
        paymentStatus: "unpaid",
      });
      setRows([EMPTY_ROW]);
      setCashAmount("");
      setCardAmount("");
      setPaymentMethod('cash');
    }
  }, [open, order]);

  const priceOf = (productId: string) =>
    products.find((product) => product.id === productId)?.price ?? 0;

  const stockOf = (productId: string) =>
    products.find((product) => product.id === productId)?.quantity ?? 0;

  const lineTotal = (row: ItemRow) =>
    priceOf(row.productId) * (Number(row.quantity) || 0);
  const total = rows.reduce((sum, row) => sum + lineTotal(row), 0);

  const updateRow = (index: number, patch: Partial<ItemRow>) => {
    setRows((previous) =>
      previous.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.customerId) next.customerId = "Mijoz tanlanishi shart";
    if (!form.deliveryDate)
      next.deliveryDate = "Yetkazish sanasi tanlanishi shart";
    if (!form.assignedTo) next.assignedTo = "Mas'ul xodim tanlanishi shart";

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
        price: priceOf(row.productId),
      }));

    // To'lov summasi hisoblash
    let paidAmount = 0;
    let calculatedPaymentStatus: PaymentStatus = "unpaid";

    if (!order) { // Faqat yangi buyurtmalar uchun
      if (paymentMethod === 'cash') {
        paidAmount = Number(cashAmount) || 0;
      } else if (paymentMethod === 'card' || paymentMethod === 'terminal') {
        paidAmount = Number(cardAmount) || 0;
      } else if (paymentMethod === 'mixed') {
        paidAmount = (Number(cashAmount) || 0) + (Number(cardAmount) || 0);
      }

      // To'lov holatini aniqlash
      if (paidAmount >= total) {
        calculatedPaymentStatus = "paid";
      } else if (paidAmount > 0) {
        calculatedPaymentStatus = "partial";
      } else {
        calculatedPaymentStatus = "unpaid";
      }
    }

    const payload = {
      customerId: form.customerId,
      items,
      deliveryDate: form.deliveryDate,
      assignedTo: form.assignedTo,
      note: form.note.trim(),
    };

    try {
      if (order) {
        await updateOrder.mutateAsync({
          id: order.id,
          ...payload,
          status: form.status,
          paymentStatus: form.paymentStatus,
        });
        toast.success("Buyurtma yangilandi");
      } else {
        await createOrder.mutateAsync({ 
          ...payload, 
          status: form.status,
          paymentStatus: calculatedPaymentStatus,
        });
        
        // To'lov xabarlari
        if (calculatedPaymentStatus === "paid") {
          toast.success("Buyurtma to'liq to'langan holda yaratildi!");
        } else if (calculatedPaymentStatus === "partial") {
          toast.success(`Buyurtma yaratildi. Qarz: ${formatCurrency(total - paidAmount)}`);
        } else {
          toast.success("Buyurtma qarz sifatida yaratildi");
        }
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
            {isEdit ? `Buyurtma ${order?.orderNumber}` : "Yangi buyurtma"}
          </DialogTitle>
          <DialogDescription>
            Buyurtma tasdiqlanganda ombordan tovar ajratiladi, to'lov
            yakunlanganda moliyaga daromad yoziladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Field
            id="order-customer"
            label="Mijoz"
            required
            error={errors.customerId}
          >
            <Select
              value={form.customerId || undefined}
              onValueChange={(value) => setForm({ ...form, customerId: value })}
            >
              <SelectTrigger
                id="order-customer"
                aria-invalid={Boolean(errors.customerId)}
              >
                <SelectValue placeholder="Mijozni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Buyurtma qatorlari */}
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
              {rows.map((row, index) => {
                const stock = stockOf(row.productId);
                const requested = Number(row.quantity) || 0;
                const shortage = row.productId && requested > stock;

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Select
                          value={row.productId || undefined}
                          onValueChange={(value) =>
                            updateRow(index, { productId: value })
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
                                {product.name} ·{" "}
                                {formatNumber(product.quantity)} dona
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
                        className="w-20 shrink-0 text-center"
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
                      <div className="mt-2 flex items-center justify-between px-0.5 text-xs">
                        <span
                          className={
                            shortage
                              ? "font-semibold text-red-600"
                              : "text-slate-400"
                          }
                        >
                          {shortage
                            ? `Omborda ${formatNumber(stock)} dona bor`
                            : `Narx: ${formatCurrency(priceOf(row.productId))}`}
                        </span>
                        <span className="font-semibold text-slate-600">
                          {formatCurrency(lineTotal(row))}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
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
              id="order-delivery"
              label="Yetkazish sanasi"
              required
              type="date"
              min={todayISO()}
              value={form.deliveryDate}
              error={errors.deliveryDate}
              onChange={(value) => setForm({ ...form, deliveryDate: value })}
            />

            <Field
              id="order-assignee"
              label="Mas'ul"
              required
              error={errors.assignedTo}
            >
              <Select
                value={form.assignedTo || undefined}
                onValueChange={(value) =>
                  setForm({ ...form, assignedTo: value })
                }
              >
                <SelectTrigger
                  id="order-assignee"
                  aria-invalid={Boolean(errors.assignedTo)}
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
            <Field id="order-status" label="Bosqich">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as OrderStatus })
                }
              >
                <SelectTrigger id="order-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {isEdit && (
              <Field id="order-payment" label="To'lov holati">
                <Select
                  value={form.paymentStatus}
                  onValueChange={(value) =>
                    setForm({ ...form, paymentStatus: value as PaymentStatus })
                  }
                >
                  <SelectTrigger id="order-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          {/* To'lov ma'lumotlari - faqat yangi buyurtmalar uchun */}
          {!isEdit && total > 0 && (
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                  To'lov ma'lumotlari
                </h4>
                
                <Field id="order-payment-method" label="To'lov usuli">
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="order-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {(paymentMethod === 'cash' || paymentMethod === 'card' || paymentMethod === 'terminal') && (
                  <div className="mt-3">
                    <Field 
                      id="order-payment-amount" 
                      label={`${
                        paymentMethod === 'cash' ? 'Naqd summa' : 
                        paymentMethod === 'card' ? 'Karta orqali' : 
                        'Terminal orqali'
                      } (ixtiyoriy - bo'sh qoldiring, qarz bo'ladi)`}
                    >
                      <Input
                        id="order-payment-amount"
                        type="number"
                        placeholder="0"
                        value={paymentMethod === 'cash' ? cashAmount : cardAmount}
                        onChange={(e) => {
                          if (paymentMethod === 'cash') {
                            setCashAmount(e.target.value);
                          } else {
                            setCardAmount(e.target.value);
                          }
                        }}
                      />
                    </Field>
                  </div>
                )}

                {paymentMethod === 'mixed' && (
                  <>
                    <div className="mt-3">
                      <Field id="order-cash-mixed" label="Naqd pul">
                        <Input
                          id="order-cash-mixed"
                          type="number"
                          placeholder="0"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="mt-3">
                      <Field id="order-card-mixed" label="Karta / Terminal">
                        <Input
                          id="order-card-mixed"
                          type="number"
                          placeholder="0"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                        />
                      </Field>
                    </div>
                    {((Number(cashAmount) || 0) + (Number(cardAmount) || 0)) > 0 && (
                      <div className="mt-3 rounded bg-white p-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Jami to'lanadi:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency((Number(cashAmount) || 0) + (Number(cardAmount) || 0))}
                          </span>
                        </div>
                        {((Number(cashAmount) || 0) + (Number(cardAmount) || 0)) < total && (
                          <div className="mt-1 flex justify-between text-red-600">
                            <span>Qarz:</span>
                            <span className="font-bold">
                              {formatCurrency(total - ((Number(cashAmount) || 0) + (Number(cardAmount) || 0)))}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  💡 Agar to'lov summasini bo'sh qoldirsangiz yoki kamroq kiritilsa, 
                  buyurtma avtomatik qarz sifatida saqlanadi.
                </p>
              </div>
            </>
          )}

          <Field id="order-note" label="Izoh">
            <Textarea
              id="order-note"
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
