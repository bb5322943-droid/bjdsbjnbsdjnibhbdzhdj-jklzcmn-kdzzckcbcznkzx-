import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Customer } from "@shared/api";
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
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-api";

export const CUSTOMER_TYPE_OPTIONS: {
  value: Customer["type"];
  label: string;
}[] = [
  { value: "company", label: "Tashkilot" },
  { value: "individual", label: "Jismoniy shaxs" },
];

const EMPTY = {
  name: "",
  type: "company" as Customer["type"],
  contactPerson: "",
  phone: "",
  email: "",
  region: "",
  address: "",
  note: "",
  status: "active" as Customer["status"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  customer?: Customer | null;
  /** Mavjud hududlar — tanlash uchun. */
  regions?: string[];
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  regions = [],
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const isEdit = Boolean(customer);
  const isPending = createCustomer.isPending || updateCustomer.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      customer
        ? {
            name: customer.name,
            type: customer.type,
            contactPerson: customer.contactPerson,
            phone: customer.phone,
            email: customer.email,
            region: customer.region,
            address: customer.address,
            note: customer.note,
            status: customer.status,
          }
        : EMPTY,
    );
  }, [open, customer]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Mijoz nomi kiritilishi shart";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Email formati noto'g'ri";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      contactPerson: form.contactPerson.trim(),
      phone: form.phone,
      email: form.email.trim(),
      region: form.region,
      address: form.address.trim(),
      note: form.note.trim(),
    };

    try {
      if (customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          ...payload,
          status: form.status,
        });
        toast.success("Mijoz ma'lumotlari yangilandi");
      } else {
        await createCustomer.mutateAsync(payload);
        toast.success("Mijoz muvaffaqiyatli qo'shildi");
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
            {isEdit ? "Mijozni tahrirlash" : "Yangi mijoz qo'shish"}
          </DialogTitle>
          <DialogDescription>
            Mijoz kartotekasi bitim va buyurtmalarga bog'lanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <TextField
            id="customer-name"
            label="Mijoz nomi"
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Masalan: Oriental Trade"
          />

          <Field id="customer-type" label="Turi">
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm({ ...form, type: value as Customer["type"] })
              }
            >
              <SelectTrigger id="customer-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="customer-contact"
            label="Aloqa shaxsi"
            value={form.contactPerson}
            onChange={(value) => setForm({ ...form, contactPerson: value })}
            placeholder="Masalan: Akmal Tursunov"
          />
          <PhoneField
            id="customer-phone"
            label="Telefon"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />
          <TextField
            id="customer-email"
            label="Email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="info@company.uz"
          />

          <Field id="customer-region" label="Hudud">
            <Select
              value={form.region || undefined}
              onValueChange={(value) => setForm({ ...form, region: value })}
            >
              <SelectTrigger id="customer-region">
                <SelectValue placeholder="Hududni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="customer-address"
            label="Manzil"
            value={form.address}
            onChange={(value) => setForm({ ...form, address: value })}
            placeholder="Ko'cha, uy raqami"
          />

          {isEdit && (
            <Field id="customer-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as Customer["status"] })
                }
              >
                <SelectTrigger id="customer-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Arxivda</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field id="customer-note" label="Izoh">
            <Textarea
              id="customer-note"
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
