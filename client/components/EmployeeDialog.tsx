import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Employee } from "@shared/api";
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
import {
  Field,
  MoneyField,
  PhoneField,
  TextField,
} from "@/components/FormField";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-api";

const EMPTY = {
  name: "",
  position: "",
  department: "",
  salary: "",
  email: "",
  phone: "",
  status: "active" as Employee["status"],
};

const STATUS_OPTIONS: { value: Employee["status"]; label: string }[] = [
  { value: "active", label: "Ishda" },
  { value: "vacation", label: "Ta'tilda" },
  { value: "sick_leave", label: "Kasallik ta'tili" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi, aks holda yangi xodim qo'shiladi. */
  employee?: Employee | null;
  departments?: string[];
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  departments = [],
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isEdit = Boolean(employee);
  const isPending = createEmployee.isPending || updateEmployee.isPending;

  // Oyna ochilganda formani tanlangan xodim ma'lumoti bilan to'ldiramiz.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      employee
        ? {
            name: employee.name,
            position: employee.position,
            department: employee.department,
            salary: employee.salary.toString(),
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
          }
        : EMPTY,
    );
  }, [open, employee]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "F.I.Sh. kiritilishi shart";
    if (!form.position.trim()) next.position = "Lavozim kiritilishi shart";
    if (!form.email.trim()) next.email = "Email kiritilishi shart";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Email formati noto'g'ri";
    if (form.salary && Number(form.salary) < 0)
      next.salary = "Maosh manfiy bo'lishi mumkin emas";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      position: form.position.trim(),
      department: form.department.trim() || "Boshqa",
      salary: Number(form.salary) || 0,
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    try {
      if (employee) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          ...payload,
          status: form.status,
        });
        toast.success("Xodim ma'lumotlari yangilandi");
      } else {
        await createEmployee.mutateAsync(payload);
        toast.success("Xodim muvaffaqiyatli qo'shildi");
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
              ? "Xodim ma'lumotlarini tahrirlash"
              : "Yangi xodim qo'shish"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "O'zgartirishlar darhol saqlanadi."
              : "Yangi xodimning ma'lumotlarini kiriting."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <TextField
            id="name"
            label="F.I.Sh."
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Masalan: Akmal Karimov"
          />
          <TextField
            id="position"
            label="Lavozim"
            required
            value={form.position}
            error={errors.position}
            onChange={(value) => setForm({ ...form, position: value })}
            placeholder="Masalan: Dasturchi"
          />

          <Field id="department" label="Bo'lim">
            <Select
              value={form.department || undefined}
              onValueChange={(value) => setForm({ ...form, department: value })}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {/* Mavjud bo'limlar serverdan keladi; ro'yxat bo'sh bo'lsa zaxira variantlar. */}
                {(departments.length > 0
                  ? departments
                  : [
                      "Savdo",
                      "Moliya",
                      "IT",
                      "HR",
                      "Marketing",
                      "Ombor",
                      "Boshqa",
                    ]
                ).map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="email"
            label="Email"
            required
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="email@company.uz"
          />
          <PhoneField
            id="phone"
            label="Telefon"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />
          <MoneyField
            id="salary"
            label="Maosh"
            value={form.salary}
            error={errors.salary}
            onChange={(value) => setForm({ ...form, salary: value })}
          />

          {isEdit && (
            <Field id="status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as Employee["status"] })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
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
