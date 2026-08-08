import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User, UserRole } from "@shared/api";
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
import { Field, TextField } from "@/components/FormField";
import { useCreateUser, useEmployees, useUpdateUser } from "@/hooks/use-api";

export const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] =
  [
    {
      value: "admin",
      label: "Administrator",
      hint: "Barcha bo'limlar + foydalanuvchilar",
    },
    {
      value: "manager",
      label: "Rahbar",
      hint: "Sozlamalardan tashqari hammasi",
    },
    {
      value: "accountant",
      label: "Buxgalter",
      hint: "Moliya, fakturalar, hisobotlar",
    },
    {
      value: "warehouse",
      label: "Ombor xodimi",
      hint: "Ombor, xaridlar, ta'minotchilar",
    },
    {
      value: "sales",
      label: "Sotuv menejeri",
      hint: "Buyurtma, bitim, mijozlar",
    },
    { value: "viewer", label: "Kuzatuvchi", hint: "Faqat ko'rish" },
  ];

const NO_EMPLOYEE = "__none__";

const EMPTY = {
  name: "",
  email: "",
  role: "viewer" as UserRole,
  employeeId: NO_EMPLOYEE,
  status: "active" as User["status"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  user?: User | null;
}

export function UserDialog({ open, onOpenChange, user }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: employeesData } = useEmployees({ limit: 100 });

  const employees = employeesData?.data ?? [];
  const isEdit = Boolean(user);
  const isPending = createUser.isPending || updateUser.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId ?? NO_EMPLOYEE,
            status: user.status,
          }
        : EMPTY,
    );
  }, [open, user]);

  /** Xodim tanlansa ism va email avtomatik to'ldiriladi. */
  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((item) => item.id === employeeId);
    setForm((previous) => ({
      ...previous,
      employeeId,
      name: employee ? employee.name : previous.name,
      email: employee ? employee.email : previous.email,
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ism kiritilishi shart";
    if (!form.email.trim()) next.email = "Email kiritilishi shart";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Email formati noto'g'ri";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      employeeId: form.employeeId === NO_EMPLOYEE ? null : form.employeeId,
    };

    try {
      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          ...payload,
          status: form.status,
        });
        toast.success("Foydalanuvchi yangilandi");
      } else {
        await createUser.mutateAsync(payload);
        toast.success("Foydalanuvchi qo'shildi");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  const selectedRole = ROLE_OPTIONS.find(
    (option) => option.value === form.role,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
          </DialogTitle>
          <DialogDescription>
            Rol foydalanuvchi qaysi bo'limlarni ochishini belgilaydi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <Field id="user-employee" label="Bog'liq xodim">
            <Select
              value={form.employeeId}
              onValueChange={handleEmployeeChange}
            >
              <SelectTrigger id="user-employee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_EMPLOYEE}>
                  Xodimga bog'lanmagan
                </SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} · {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="user-name"
            label="Ism"
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Masalan: Azizbek Mansurov"
          />
          <TextField
            id="user-email"
            label="Email"
            required
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="email@company.uz"
          />

          <Field id="user-role" label="Rol">
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm({ ...form, role: value as UserRole })
              }
            >
              <SelectTrigger id="user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="mt-1.5 text-xs text-slate-400">
                {selectedRole.hint}
              </p>
            )}
          </Field>

          {isEdit && (
            <Field id="user-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as User["status"] })
                }
              >
                <SelectTrigger id="user-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="suspended">To'xtatilgan</SelectItem>
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
