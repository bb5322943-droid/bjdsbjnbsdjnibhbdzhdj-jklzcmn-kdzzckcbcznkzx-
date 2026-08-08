import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Payroll } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, MoneyField } from "@/components/FormField";
import { useUpdatePayroll } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll?: Payroll | null;
}

/**
 * Ish haqiga bonus/jarima va izoh kiritish oynasi.
 * Soliq va yakuniy summa serverda qayta hisoblanadi; bu yerda foydalanuvchiga
 * natijani oldindan ko'rsatish uchun bir xil formula bilan taxminiy hisoblaymiz.
 */
export function PayrollDialog({ open, onOpenChange, payroll }: Props) {
  const [bonus, setBonus] = useState("0");
  const [penalty, setPenalty] = useState("0");
  const [note, setNote] = useState("");

  const updatePayroll = useUpdatePayroll();

  useEffect(() => {
    if (!open || !payroll) return;
    setBonus(String(payroll.bonus));
    setPenalty(String(payroll.penalty));
    setNote(payroll.note ?? "");
  }, [open, payroll]);

  if (!payroll) return null;

  const bonusNum = Number(bonus) || 0;
  const penaltyNum = Number(penalty) || 0;

  // Serverdagi bilan bir xil formula — oldindan ko'rsatish uchun.
  const taxable = Math.max(
    0,
    payroll.baseSalary - payroll.absenceDeduction + bonusNum - penaltyNum,
  );
  const tax = Math.round(taxable * 0.12);
  const netPreview = taxable - tax;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updatePayroll.mutateAsync({
        id: payroll.id,
        bonus: bonusNum,
        penalty: penaltyNum,
        note: note.trim(),
      });
      toast.success("Ish haqi yangilandi");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Ish haqini tahrirlash</DialogTitle>
          <DialogDescription>
            {payroll.employeeName} · asosiy maosh {formatCurrency(payroll.baseSalary)}.
            Bonus va jarima yakuniy summani o'zgartiradi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyField id="payroll-bonus" label="Bonus" value={bonus} onChange={setBonus} />
            <MoneyField
              id="payroll-penalty"
              label="Jarima"
              value={penalty}
              onChange={setPenalty}
            />
          </div>

          <Field id="payroll-note" label="Izoh">
            <Textarea
              id="payroll-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ixtiyoriy izoh"
              rows={2}
            />
          </Field>

          {/* Yakuniy summani oldindan ko'rsatamiz — saqlashdan oldin ko'rinadi. */}
          <div className="space-y-1.5 rounded-lg bg-slate-50 px-3.5 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Soliqqa tortiladigan</span>
              <span className="font-medium text-slate-700">{formatCurrency(taxable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Soliq (12%)</span>
              <span className="font-medium text-slate-700">−{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="font-semibold text-slate-600">Qo'lga tegadi</span>
              <span className="font-bold text-slate-900">{formatCurrency(netPreview)}</span>
            </div>
          </div>

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
              disabled={updatePayroll.isPending}
              className="flex-1 bg-[#173f38] hover:bg-[#0f312b]"
            >
              {updatePayroll.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
