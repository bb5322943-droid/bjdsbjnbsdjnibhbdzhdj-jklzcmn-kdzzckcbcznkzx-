import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Invoice, InvoiceStatus } from "@shared/api";
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
import { Field, MoneyField, TextField } from "@/components/FormField";
import {
  useCreateInvoice,
  useCustomers,
  useOrders,
  useRecordInvoicePayment,
  useUpdateInvoice,
} from "@/hooks/use-api";
import { formatCurrency, todayISO } from "@/lib/format";

export const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] =
  [
    { value: "draft", label: "Qoralama" },
    { value: "sent", label: "Yuborilgan" },
    { value: "paid", label: "To'langan" },
    { value: "overdue", label: "Muddati o'tgan" },
    { value: "cancelled", label: "Bekor qilingan" },
  ];

const NO_ORDER = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  invoice?: Invoice | null;
}

export function InvoiceDialog({ open, onOpenChange, invoice }: Props) {
  const [form, setForm] = useState({
    customerId: "",
    orderId: NO_ORDER,
    amount: "",
    dueDate: "",
    note: "",
    status: "sent" as InvoiceStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: customersData } = useCustomers({ limit: 200 });
  // Faktura odatda mavjud buyurtma asosida chiqariladi.
  const { data: ordersData } = useOrders({ limit: 200 });

  const customers = customersData?.data ?? [];
  const orders = ordersData?.data ?? [];

  const isEdit = Boolean(invoice);
  const isPending = createInvoice.isPending || updateInvoice.isPending;

  // Mijoz tanlangach faqat uning buyurtmalari ko'rsatiladi.
  const availableOrders = form.customerId
    ? orders.filter((order) => order.customerId === form.customerId)
    : orders;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      invoice
        ? {
            customerId: invoice.customerId,
            orderId: invoice.orderId ?? NO_ORDER,
            amount: invoice.amount.toString(),
            dueDate: invoice.dueDate,
            note: invoice.note,
            status: invoice.status,
          }
        : {
            customerId: "",
            orderId: NO_ORDER,
            amount: "",
            dueDate: "",
            note: "",
            status: "sent",
          },
    );
  }, [open, invoice]);

  /** Buyurtma tanlansa summa avtomatik to'ldiriladi. */
  const handleOrderChange = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    setForm((previous) => ({
      ...previous,
      orderId,
      amount: order ? order.total.toString() : previous.amount,
      customerId: order ? order.customerId : previous.customerId,
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.customerId) next.customerId = "Mijoz tanlanishi shart";
    if (!form.amount || Number(form.amount) <= 0)
      next.amount = "Summa noldan katta bo'lishi kerak";
    if (!form.dueDate) next.dueDate = "To'lov muddati tanlanishi shart";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      customerId: form.customerId,
      orderId: form.orderId === NO_ORDER ? null : form.orderId,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      note: form.note.trim(),
      status: form.status,
    };

    try {
      if (invoice) {
        await updateInvoice.mutateAsync({ id: invoice.id, ...payload });
        toast.success("Faktura yangilandi");
      } else {
        await createInvoice.mutateAsync(payload);
        toast.success("Hisob-faktura chiqarildi");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Faktura ${invoice?.invoiceNumber}`
              : "Yangi hisob-faktura"}
          </DialogTitle>
          <DialogDescription>
            Buyurtma tanlansa summa avtomatik to'ldiriladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Field
            id="invoice-customer"
            label="Mijoz"
            required
            error={errors.customerId}
          >
            <Select
              value={form.customerId || undefined}
              onValueChange={(value) =>
                setForm({ ...form, customerId: value, orderId: NO_ORDER })
              }
            >
              <SelectTrigger
                id="invoice-customer"
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

          <Field id="invoice-order" label="Bog'liq buyurtma">
            <Select value={form.orderId} onValueChange={handleOrderChange}>
              <SelectTrigger id="invoice-order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ORDER}>Buyurtmasiz (qo'lda)</SelectItem>
                {availableOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.orderNumber} · {formatCurrency(order.total)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <MoneyField
            id="invoice-amount"
            label="Summa"
            required
            value={form.amount}
            error={errors.amount}
            onChange={(value) => setForm({ ...form, amount: value })}
          />

          <TextField
            id="invoice-due"
            label="To'lov muddati"
            required
            type="date"
            min={isEdit ? undefined : todayISO()}
            value={form.dueDate}
            error={errors.dueDate}
            onChange={(value) => setForm({ ...form, dueDate: value })}
          />

          {isEdit && (
            <Field id="invoice-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as InvoiceStatus })
                }
              >
                <SelectTrigger id="invoice-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field id="invoice-note" label="Izoh">
            <Textarea
              id="invoice-note"
              value={form.note}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value })
              }
              placeholder="To'lov shartlari"
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

/** Faktura bo'yicha to'lov qabul qilish — qisman to'lov ham mumkin. */
export function InvoicePaymentDialog({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const recordPayment = useRecordInvoicePayment();

  const remaining = invoice ? invoice.amount - invoice.paidAmount : 0;

  useEffect(() => {
    if (!open || !invoice) return;
    // Odatda qoldiq to'liq to'lanadi — shu qiymat oldindan qo'yiladi.
    setAmount((invoice.amount - invoice.paidAmount).toString());
    setError("");
  }, [open, invoice]);

  if (!invoice) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const value = Number(amount) || 0;
    if (value <= 0) {
      setError("To'lov summasi noldan katta bo'lishi kerak");
      return;
    }

    try {
      const result = await recordPayment.mutateAsync({
        id: invoice.id,
        amount: value,
      });
      toast.success(result.message ?? "To'lov qabul qilindi");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>To'lov qayd etish</DialogTitle>
          <DialogDescription>
            {invoice.invoiceNumber} · {invoice.customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <dl className="space-y-1.5 rounded-lg bg-slate-50 px-3.5 py-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Faktura summasi</dt>
              <dd className="font-semibold text-slate-700">
                {formatCurrency(invoice.amount)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">To'langan</dt>
              <dd className="font-semibold text-slate-700">
                {formatCurrency(invoice.paidAmount)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <dt className="text-slate-500">Qoldiq</dt>
              <dd className="font-bold text-[#b5761f]">
                {formatCurrency(remaining)}
              </dd>
            </div>
          </dl>

          <MoneyField
            id="payment-amount"
            label="To'lov summasi"
            required
            value={amount}
            error={error}
            onChange={(value) => {
              setAmount(value);
              setError("");
            }}
          />

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
              disabled={recordPayment.isPending}
              className="flex-1 bg-[#173f38] hover:bg-[#0f312b]"
            >
              {recordPayment.isPending
                ? "Saqlanmoqda..."
                : "To'lovni qabul qilish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
