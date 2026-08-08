import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Deal } from "@shared/api";
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
import { useCreateDeal, useEmployees, useUpdateDeal } from "@/hooks/use-api";

export const DEAL_STATUS_OPTIONS: { value: Deal["status"]; label: string }[] = [
  { value: "new_lead", label: "Yangi lead" },
  { value: "negotiation", label: "Muzokara" },
  { value: "proposal", label: "Taklif" },
  { value: "closed_won", label: "Muvaffaqiyatli yopildi" },
  { value: "closed_lost", label: "Yo'qotildi" },
];

const EMPTY = {
  clientName: "",
  value: "",
  description: "",
  expectedCloseDate: "",
  assignedTo: "",
  status: "new_lead" as Deal["status"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  deal?: Deal | null;
}

export function DealDialog({ open, onOpenChange, deal }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  // Mas'ul xodimlar ro'yxati HR moduldan keladi — qo'lda yozish o'rniga tanlanadi.
  // Holat bo'yicha filtrlamaymiz: ta'tildagi xodimga biriktirilgan bitimni
  // tahrirlaganda uning ismi ro'yxatdan tushib qolmasligi kerak.
  const { data: employeesData } = useEmployees({ limit: 100 });

  const isEdit = Boolean(deal);
  const isPending = createDeal.isPending || updateDeal.isPending;
  const employees = employeesData?.data ?? [];

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      deal
        ? {
            clientName: deal.clientName,
            value: deal.value.toString(),
            description: deal.description,
            expectedCloseDate: deal.expectedCloseDate,
            assignedTo: deal.assignedTo,
            status: deal.status,
          }
        : EMPTY,
    );
  }, [open, deal]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.clientName.trim())
      next.clientName = "Mijoz nomi kiritilishi shart";
    if (!form.value || Number(form.value) <= 0)
      next.value = "Bitim summasi noldan katta bo'lishi kerak";
    if (!form.expectedCloseDate)
      next.expectedCloseDate = "Yopilish sanasi tanlanishi shart";
    if (!form.assignedTo) next.assignedTo = "Mas'ul xodim tanlanishi shart";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      clientName: form.clientName.trim(),
      value: Number(form.value),
      description: form.description.trim(),
      expectedCloseDate: form.expectedCloseDate,
      assignedTo: form.assignedTo,
    };

    try {
      if (deal) {
        await updateDeal.mutateAsync({
          id: deal.id,
          ...payload,
          status: form.status,
        });
        toast.success("Bitim yangilandi");
      } else {
        await createDeal.mutateAsync(payload);
        toast.success("Bitim muvaffaqiyatli yaratildi");
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
            {isEdit ? "Bitimni tahrirlash" : "Yangi bitim yaratish"}
          </DialogTitle>
          <DialogDescription>
            Bitim voronkaning "Yangi lead" bosqichidan boshlanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <TextField
            id="clientName"
            label="Mijoz nomi"
            required
            value={form.clientName}
            error={errors.clientName}
            onChange={(value) => setForm({ ...form, clientName: value })}
            placeholder="Masalan: Oriental Trade"
          />
          <MoneyField
            id="value"
            label="Bitim summasi"
            required
            value={form.value}
            error={errors.value}
            onChange={(value) => setForm({ ...form, value })}
          />

          <Field
            id="assignedTo"
            label="Mas'ul xodim"
            required
            error={errors.assignedTo}
          >
            <Select
              value={form.assignedTo || undefined}
              onValueChange={(value) => setForm({ ...form, assignedTo: value })}
            >
              <SelectTrigger
                id="assignedTo"
                aria-invalid={Boolean(errors.assignedTo)}
              >
                <SelectValue placeholder="Xodimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.name}>
                    {employee.name} · {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="expectedCloseDate"
            label="Kutilayotgan yopilish sanasi"
            required
            type="date"
            value={form.expectedCloseDate}
            error={errors.expectedCloseDate}
            onChange={(value) => setForm({ ...form, expectedCloseDate: value })}
          />

          {isEdit && (
            <Field id="deal-status" label="Bosqich">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as Deal["status"] })
                }
              >
                <SelectTrigger id="deal-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field id="description" label="Izoh">
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Bitim tafsilotlari"
              rows={3}
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
