import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Order } from "@shared/api";
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
import { Label } from "@/components/ui/label";
import { MoneyField, SelectField, TextField } from "@/components/FormField";
import { useCreateDebtPayment } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/format";
import { Banknote, CreditCard, DollarSign, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EMPTY = {
  amount: "",
  paymentMethod: "Naqd",
  note: "",
  cashAmount: "",
  cardAmount: "",
  terminalAmount: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  alreadyPaid?: number;
}

export function DebtPaymentDialog({ open, onOpenChange, order, alreadyPaid = 0 }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPayment = useCreateDebtPayment();
  const isPending = createPayment.isPending;

  const remainingDebt = order ? order.total - alreadyPaid : 0;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(EMPTY);
  }, [open, order]);

  const validate = () => {
    const next: Record<string, string> = {};
    const cash = Number(form.cashAmount) || 0;
    const card = Number(form.cardAmount) || 0;
    const terminal = Number(form.terminalAmount) || 0;
    const totalPayment = cash + card + terminal;
    
    if (totalPayment <= 0) {
      next.amount = "Kamida bitta to'lov usuli orqali summa kiritilishi shart";
    } else if (totalPayment > remainingDebt) {
      next.amount = `To'lov qoldiq qarzdan oshib ketmasligi kerak: ${formatCurrency(remainingDebt)}`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !order) return;

    const cash = Number(form.cashAmount) || 0;
    const card = Number(form.cardAmount) || 0;
    const terminal = Number(form.terminalAmount) || 0;
    const totalPayment = cash + card + terminal;

    // To'lov turini aniqlash
    let paymentMethod = "Naqd";
    const paymentCount = [cash > 0, card > 0, terminal > 0].filter(Boolean).length;
    
    if (paymentCount > 1) {
      paymentMethod = "Aralash";
    } else if (card > 0) {
      paymentMethod = "Plastik karta";
    } else if (terminal > 0) {
      paymentMethod = "Terminal";
    }

    try {
      await createPayment.mutateAsync({
        orderId: order.id,
        amount: totalPayment,
        paymentMethod: paymentMethod,
        note: form.note || `Naqd: ${formatCurrency(cash)}, Karta: ${formatCurrency(card)}, Terminal: ${formatCurrency(terminal)}`,
      });
      toast.success("To'lov muvaffaqiyatli qo'shildi");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Qarz To'lovi</DialogTitle>
          <DialogDescription>
            {order.customerName} - {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Jami summa:</span>
            <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
          </div>
          {alreadyPaid > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">To'langan:</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(alreadyPaid)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-600 font-semibold">Qoldiq qarz:</span>
            <span className="font-bold text-[#d5943c] text-lg">
              {formatCurrency(remainingDebt)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Payment Input Fields - 3 inputs */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <Banknote size={16} className="text-slate-600" />
                Naqd
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.cashAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || Number(value) >= 0) {
                    setForm({ ...form, cashAmount: value });
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value) || 0;
                  const card = Number(form.cardAmount) || 0;
                  const terminal = Number(form.terminalAmount) || 0;
                  
                  if (value + card + terminal > remainingDebt) {
                    const remaining = remainingDebt - card - terminal;
                    setForm({ ...form, cashAmount: remaining >= 0 ? remaining.toString() : '0' });
                  }
                }}
                className="h-10"
                min="0"
              />
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <CreditCard size={16} className="text-slate-600" />
                Karta
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.cardAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || Number(value) >= 0) {
                    setForm({ ...form, cardAmount: value });
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value) || 0;
                  const cash = Number(form.cashAmount) || 0;
                  const terminal = Number(form.terminalAmount) || 0;
                  
                  if (value + cash + terminal > remainingDebt) {
                    const remaining = remainingDebt - cash - terminal;
                    setForm({ ...form, cardAmount: remaining >= 0 ? remaining.toString() : '0' });
                  }
                }}
                className="h-10"
                min="0"
              />
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <DollarSign size={16} className="text-slate-600" />
                Terminal
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={form.terminalAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || Number(value) >= 0) {
                    setForm({ ...form, terminalAmount: value });
                  }
                }}
                onBlur={(e) => {
                  const value = Number(e.target.value) || 0;
                  const cash = Number(form.cashAmount) || 0;
                  const card = Number(form.cardAmount) || 0;
                  
                  if (value + cash + card > remainingDebt) {
                    const remaining = remainingDebt - cash - card;
                    setForm({ ...form, terminalAmount: remaining >= 0 ? remaining.toString() : '0' });
                  }
                }}
                className="h-10"
                min="0"
              />
            </div>
          </div>

          {/* Payment Summary */}
          {(() => {
            const cash = Number(form.cashAmount) || 0;
            const card = Number(form.cardAmount) || 0;
            const terminal = Number(form.terminalAmount) || 0;
            const total = cash + card + terminal;
            
            return total > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Wallet className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800 font-medium">
                  Jami to'lov: {formatCurrency(total)}
                </AlertDescription>
              </Alert>
            );
          })()}

          {errors.amount && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-sm text-red-800">
                {errors.amount}
              </AlertDescription>
            </Alert>
          )}

          <TextField
            id="payment-note"
            label="Izoh"
            value={form.note}
            onChange={(value) => setForm({ ...form, note: value })}
            placeholder="Qo'shimcha ma'lumot (ixtiyoriy)"
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
              {isPending ? "Saqlanmoqda..." : "To'lov Qilish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
