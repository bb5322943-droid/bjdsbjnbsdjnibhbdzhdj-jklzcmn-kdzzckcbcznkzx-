import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AttendanceRecord } from "@shared/api";
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
import { useMarkAttendance, useEmployees } from "@/hooks/use-api";
import { todayISO } from "@/lib/format";

export const ATTENDANCE_STATUS_OPTIONS: {
  value: AttendanceRecord["status"];
  label: string;
}[] = [
  { value: "present", label: "Kelgan" },
  { value: "late", label: "Kechikkan" },
  { value: "remote", label: "Masofadan" },
  { value: "absent", label: "Kelmagan" },
  { value: "leave", label: "Ta'tilda" },
];

const EMPTY = {
  employeeId: "",
  status: "present" as AttendanceRecord["status"],
  date: todayISO(),
  checkIn: "09:00",
  checkOut: "18:00",
  note: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi (faqat bitta yozuvni yangilash). */
  record?: AttendanceRecord | null;
}

export function AttendanceDialog({ open, onOpenChange, record }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const markAttendance = useMarkAttendance();
  const { data: employeesData } = useEmployees({ limit: 100 });
  const employees = employeesData?.data ?? [];

  const isPending = markAttendance.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (record) {
      setForm({
        employeeId: record.employeeId,
        status: record.status,
        date: record.date,
        checkIn: record.checkIn || "09:00",
        checkOut: record.checkOut || "18:00",
        note: record.note,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, record]);

  const isWorked = ["present", "late", "remote"].includes(form.status);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.employeeId) next.employeeId = "Xodim tanlanishi shart";
    if (!form.date) next.date = "Sana kiritilishi shart";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      const result = await markAttendance.mutateAsync({
        employeeId: form.employeeId,
        status: form.status,
        date: form.date,
        checkIn: isWorked ? form.checkIn : undefined,
        checkOut: isWorked ? form.checkOut : undefined,
        note: form.note,
      });
      toast.success(result.message || "Davomat saqlandi");
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
            {record ? "Davomatni tahrirlash" : "Davomat belgilash"}
          </DialogTitle>
          <DialogDescription>
            Xodimning kunlik davomatini belgilang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Field id="attendance-employee" label="Xodim" required>
            <Select
              value={form.employeeId}
              onValueChange={(value) => setForm({ ...form, employeeId: value })}
              disabled={Boolean(record)}
            >
              <SelectTrigger id="attendance-employee">
                <SelectValue placeholder="Xodimni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <p className="mt-1 text-xs text-red-500">{errors.employeeId}</p>
            )}
          </Field>

          <Field id="attendance-status" label="Holati" required>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm({ ...form, status: value as AttendanceRecord["status"] })
              }
            >
              <SelectTrigger id="attendance-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="attendance-date"
            label="Sana"
            type="date"
            required
            value={form.date}
            error={errors.date}
            onChange={(value) => setForm({ ...form, date: value })}
          />

          {isWorked && (
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="attendance-checkin"
                label="Kelgan vaqti"
                value={form.checkIn}
                onChange={(value) => setForm({ ...form, checkIn: value })}
                placeholder="09:00"
              />
              <TextField
                id="attendance-checkout"
                label="Ketgan vaqti"
                value={form.checkOut}
                onChange={(value) => setForm({ ...form, checkOut: value })}
                placeholder="18:00"
              />
            </div>
          )}

          <Field id="attendance-note" label="Izoh">
            <Textarea
              id="attendance-note"
              value={form.note}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value })
              }
              placeholder="Qo'shimcha ma'lumot"
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
