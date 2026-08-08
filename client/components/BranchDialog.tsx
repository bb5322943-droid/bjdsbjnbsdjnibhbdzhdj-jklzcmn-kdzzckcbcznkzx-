import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Branch } from "@shared/api";
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
import { Field, PhoneField, TextField } from "@/components/FormField";
import { useCreateBranch, useUpdateBranch } from "@/hooks/use-api";

export const BRANCH_TYPE_OPTIONS: {
  value: Branch["type"];
  label: string;
}[] = [
  { value: "head_office", label: "Bosh ofis" },
  { value: "branch", label: "Filial" },
];

const EMPTY = {
  name: "",
  type: "branch" as Branch["type"],
  region: "",
  address: "",
  phone: "",
  manager: "",
  note: "",
  status: "active" as Branch["status"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  branch?: Branch | null;
}

export function BranchDialog({ open, onOpenChange, branch }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const isEdit = Boolean(branch);
  const isPending = createBranch.isPending || updateBranch.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      branch
        ? {
            name: branch.name,
            type: branch.type,
            region: branch.region,
            address: branch.address,
            phone: branch.phone,
            manager: branch.manager,
            note: branch.note,
            status: branch.status,
          }
        : EMPTY,
    );
  }, [open, branch]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Filial nomi kiritilishi shart";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      region: form.region.trim(),
      address: form.address.trim(),
      phone: form.phone,
      manager: form.manager.trim(),
      note: form.note.trim(),
    };

    try {
      if (branch) {
        await updateBranch.mutateAsync({
          id: branch.id,
          ...payload,
          status: form.status,
        });
        toast.success("Filial ma'lumotlari yangilandi");
      } else {
        await createBranch.mutateAsync(payload);
        toast.success("Filial muvaffaqiyatli qo'shildi");
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
            {isEdit ? "Filialni tahrirlash" : "Yangi filial qo'shish"}
          </DialogTitle>
          <DialogDescription>
            Filial ma'lumotlarini to'ldiring. Bosh ofis faqat bitta bo'lishi mumkin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <TextField
            id="branch-name"
            label="Filial nomi"
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Masalan: Samarqand filiali"
          />

          <Field id="branch-type" label="Turi">
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm({ ...form, type: value as Branch["type"] })
              }
            >
              <SelectTrigger id="branch-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="branch-region"
            label="Hudud"
            value={form.region}
            onChange={(value) => setForm({ ...form, region: value })}
            placeholder="Masalan: Samarqand viloyati"
          />

          <TextField
            id="branch-address"
            label="Manzil"
            value={form.address}
            onChange={(value) => setForm({ ...form, address: value })}
            placeholder="Ko'cha, uy raqami"
          />

          <PhoneField
            id="branch-phone"
            label="Telefon"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />

          <TextField
            id="branch-manager"
            label="Filial mas'uli"
            value={form.manager}
            onChange={(value) => setForm({ ...form, manager: value })}
            placeholder="Masalan: Akmal Tursunov"
          />

          {isEdit && (
            <Field id="branch-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as Branch["status"] })
                }
              >
                <SelectTrigger id="branch-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field id="branch-note" label="Izoh">
            <Textarea
              id="branch-note"
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
