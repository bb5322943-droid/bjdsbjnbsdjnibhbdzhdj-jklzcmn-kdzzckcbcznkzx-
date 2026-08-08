import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Transaction } from "@shared/api";
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
import { Button } from "@/components/ui/button";
import { Field, MoneyField, TextField } from "@/components/FormField";
import { useCreateTransaction, useUpdateTransaction } from "@/hooks/use-api";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCOUNTS = ["Ipak Yo'li bank · UZS", "Hamkorbank · UZS", "Kassa · UZS"];

const INCOME_CATEGORIES = [
  "Savdo daromadi",
  "Xizmat ko'rsatish",
  "Investitsiya",
  "Boshqa",
];
const EXPENSE_CATEGORIES = [
  "Ijara xarajati",
  "Ish haqi",
  "Marketing",
  "Yetkazib berish",
  "Kommunal",
  "Xarid",
  "Boshqa",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  transaction?: Transaction | null;
}

export function TransactionDialog({ open, onOpenChange, transaction }: Props) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    account: ACCOUNTS[0],
    amount: "",
    type: "income" as Transaction["type"],
    date: todayISO(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const isEdit = Boolean(transaction);
  const isPending = createTransaction.isPending || updateTransaction.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      transaction
        ? {
            title: transaction.title,
            category: transaction.category,
            account: transaction.account,
            amount: transaction.amount.toString(),
            type: transaction.type,
            date: transaction.date,
          }
        : {
            title: "",
            category: "",
            account: ACCOUNTS[0],
            amount: "",
            type: "income",
            date: todayISO(),
          },
    );
  }, [open, transaction]);

  const categories =
    form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Nomi kiritilishi shart";
    if (!form.amount || Number(form.amount) <= 0)
      next.amount = "Summa noldan katta bo'lishi kerak";
    if (!form.date) next.date = "Sana tanlanishi shart";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      category: form.category || "Boshqa",
      account: form.account,
      amount: Number(form.amount),
      type: form.type,
      date: form.date,
    };

    try {
      if (transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, ...payload });
        toast.success("Tranzaksiya yangilandi");
      } else {
        await createTransaction.mutateAsync(payload);
        toast.success("Tranzaksiya muvaffaqiyatli yaratildi");
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
            {isEdit ? "Tranzaksiyani tahrirlash" : "Yangi tranzaksiya"}
          </DialogTitle>
          <DialogDescription>
            Kirim yoki chiqim amalini qayd eting — balans darhol yangilanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Tur tanlash — segmentli tugma, chunki bu formadagi eng muhim tanlov. */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            {(["income", "expense"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type, category: "" })}
                aria-pressed={form.type === type}
                className={cn(
                  "rounded-md py-2 text-sm font-semibold transition",
                  form.type === type
                    ? type === "income"
                      ? "bg-white text-[#2d7d64] shadow-sm"
                      : "bg-white text-[#bd792b] shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {type === "income" ? "Kirim" : "Chiqim"}
              </button>
            ))}
          </div>

          <TextField
            id="title"
            label="Nomi"
            required
            value={form.title}
            error={errors.title}
            onChange={(value) => setForm({ ...form, title: value })}
            placeholder="Masalan: Oriental Trade to'lovi"
          />
          <MoneyField
            id="amount"
            label="Summa"
            required
            value={form.amount}
            error={errors.amount}
            onChange={(value) => setForm({ ...form, amount: value })}
          />

          <Field id="category" label="Kategoriya">
            <Select
              value={form.category || undefined}
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Kategoriyani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="account" label="Hisob">
            <Select
              value={form.account}
              onValueChange={(value) => setForm({ ...form, account: value })}
            >
              <SelectTrigger id="account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTS.map((account) => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="date"
            label="Sana"
            required
            type="date"
            value={form.date}
            error={errors.date}
            onChange={(value) => setForm({ ...form, date: value })}
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
