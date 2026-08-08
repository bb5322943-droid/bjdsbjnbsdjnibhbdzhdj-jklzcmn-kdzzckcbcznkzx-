import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Product } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, TextField } from "@/components/FormField";
import { useAdjustStock } from "@/hooks/use-api";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const REASONS = [
  "Inventarizatsiya tuzatishi",
  "Yaroqsiz deb hisobdan chiqarish",
  "Ta'minotchidan qabul",
  "Ichki ehtiyoj uchun berildi",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

/** Qo'lda qoldiq tuzatish — inventarizatsiya yoki hisobdan chiqarish uchun. */
export function StockAdjustDialog({ open, onOpenChange, product }: Props) {
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const adjustStock = useAdjustStock();

  useEffect(() => {
    if (!open) return;
    setDirection("in");
    setAmount("");
    setReason(REASONS[0]);
    setErrors({});
  }, [open]);

  if (!product) return null;

  const quantity = Number(amount) || 0;
  const delta = direction === "in" ? quantity : -quantity;
  const resulting = product.quantity + delta;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (quantity <= 0) next.amount = "Miqdor noldan katta bo'lishi kerak";
    else if (resulting < 0)
      next.amount = `Omborda ${formatNumber(product.quantity)} dona bor — bundan ko'pini chiqarib bo'lmaydi`;
    if (!reason.trim()) next.reason = "Sabab kiritilishi shart";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await adjustStock.mutateAsync({
        id: product.id,
        delta,
        reason: reason.trim(),
      });
      toast.success(
        `${product.name}: qoldiq ${formatNumber(resulting)} dona bo'ldi`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Qoldiqni tuzatish</DialogTitle>
          <DialogDescription>
            {product.name} · hozirgi qoldiq {formatNumber(product.quantity)}{" "}
            dona
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            {(["in", "out"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDirection(value)}
                aria-pressed={direction === value}
                className={cn(
                  "rounded-md py-2 text-sm font-semibold transition",
                  direction === value
                    ? value === "in"
                      ? "bg-white text-[#2d7d64] shadow-sm"
                      : "bg-white text-[#bd792b] shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {value === "in" ? "Kirim" : "Chiqim"}
              </button>
            ))}
          </div>

          <Field
            id="adjust-amount"
            label="Miqdor (dona)"
            required
            error={errors.amount}
          >
            <Input
              id="adjust-amount"
              inputMode="numeric"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/\D/g, ""))
              }
              placeholder="0"
              aria-invalid={Boolean(errors.amount)}
              className={
                errors.amount
                  ? "border-red-400 focus-visible:ring-red-400"
                  : undefined
              }
            />
          </Field>

          <TextField
            id="adjust-reason"
            label="Sabab"
            required
            value={reason}
            error={errors.reason}
            onChange={setReason}
            placeholder="Masalan: inventarizatsiya tuzatishi"
          />

          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-[#a8d1c2] hover:text-slate-700"
              >
                {preset}
              </button>
            ))}
          </div>

          {quantity > 0 && resulting >= 0 && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="text-slate-500">Yangi qoldiq</span>
              <span className="font-bold text-slate-900">
                {formatNumber(product.quantity)} → {formatNumber(resulting)}{" "}
                dona
              </span>
            </div>
          )}

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
              disabled={adjustStock.isPending}
              className="flex-1 bg-[#173f38] hover:bg-[#0f312b]"
            >
              {adjustStock.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
