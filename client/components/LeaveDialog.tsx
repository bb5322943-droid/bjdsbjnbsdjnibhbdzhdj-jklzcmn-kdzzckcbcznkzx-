import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LeaveRequest, LeaveStatus, LeaveType } from "@shared/api";
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
import { Field, TextField } from "@/components/FormField";
import {
  useCreateLeaveRequest,
  useEmployees,
  useUpdateLeaveRequest,
} from "@/hooks/use-api";

export const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "vacation", label: "Mehnat ta'tili" },
  { value: "sick", label: "Kasallik ta'tili" },
  { value: "personal", label: "Shaxsiy sabab" },
  { value: "unpaid", label: "Haq to'lanmaydigan" },
];

export const LEAVE_STATUS_OPTIONS: { value: LeaveStatus; label: string }[] = [
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];

const EMPTY = {
  employeeId: "",
  type: "vacation" as LeaveType,
  startDate: "",
  endDate: "",
  reason: "",
  status: "pending" as LeaveStatus,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  request?: LeaveRequest | null;
}

export function LeaveDialog({ open, onOpenChange, request }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createLeave = useCreateLeaveRequest();
  const updateLeave = useUpdateLeaveRequest();
  const { data: employeesData } = useEmployees({ limit: 100 });

  const employees = employeesData?.data ?? [];
  const isEdit = Boolean(request);
  const isPending = createLeave.isPending || updateLeave.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      request
        ? {
            employeeId: request.employeeId,
            type: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
            reason: request.reason,
            status: request.status,
          }
        : EMPTY,
    );
  }, [open, request]);

  /** Tanlangan oraliqdagi kunlar soni — foydalanuvchiga oldindan ko'rsatiladi. */
  const days =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? Math.floor(
          (new Date(form.endDate).getTime() -
            new Date(form.startDate).getTime()) /
            (24 * 60 * 60 * 1000),
        ) + 1
      : 0;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.employeeId) next.employeeId = "Xodim tanlanishi shart";
    if (!form.startDate) next.startDate = "Boshlanish sanasi tanlanishi shart";
    if (!form.endDate) next.endDate = "Tugash sanasi tanlanishi shart";
    else if (form.startDate && form.endDate < form.startDate)
      next.endDate =
        "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      employeeId: form.employeeId,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim(),
    };

    try {
      if (request) {
        await updateLeave.mutateAsync({
          id: request.id,
          ...payload,
          status: form.status,
        });
        toast.success("Ta'til so'rovi yangilandi");
      } else {
        await createLeave.mutateAsync(payload);
        toast.success("Ta'til so'rovi yuborildi");
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
            {isEdit ? "Ta'til so'rovini tahrirlash" : "Yangi ta'til so'rovi"}
          </DialogTitle>
          <DialogDescription>
            Tasdiqlangan ta'til xodimning joriy holatiga avtomatik ta'sir
            qiladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Field
            id="leave-employee"
            label="Xodim"
            required
            error={errors.employeeId}
          >
            <Select
              value={form.employeeId || undefined}
              onValueChange={(value) => setForm({ ...form, employeeId: value })}
            >
              <SelectTrigger
                id="leave-employee"
                aria-invalid={Boolean(errors.employeeId)}
              >
                <SelectValue placeholder="Xodimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} · {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="leave-type" label="Ta'til turi">
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm({ ...form, type: value as LeaveType })
              }
            >
              <SelectTrigger id="leave-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="leave-start"
              label="Boshlanish"
              required
              type="date"
              value={form.startDate}
              error={errors.startDate}
              onChange={(value) => setForm({ ...form, startDate: value })}
            />
            <TextField
              id="leave-end"
              label="Tugash"
              required
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              error={errors.endDate}
              onChange={(value) => setForm({ ...form, endDate: value })}
            />
          </div>

          {days > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="text-slate-500">Jami kunlar</span>
              <span className="font-bold text-slate-900">{days} kun</span>
            </div>
          )}

          {isEdit && (
            <Field id="leave-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as LeaveStatus })
                }
              >
                <SelectTrigger id="leave-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field id="leave-reason" label="Sabab">
            <Textarea
              id="leave-reason"
              value={form.reason}
              onChange={(event) =>
                setForm({ ...form, reason: event.target.value })
              }
              placeholder="Ta'til sababi"
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
