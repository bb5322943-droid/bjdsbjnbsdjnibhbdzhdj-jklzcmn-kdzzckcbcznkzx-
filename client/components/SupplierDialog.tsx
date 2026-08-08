import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Supplier } from "@shared/api";
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
import { Field, PhoneField, TextField } from "@/components/FormField";
import { useCreateSupplier, useUpdateSupplier } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const EMPTY = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  category: "",
  address: "",
  rating: 3,
  status: "active" as Supplier["status"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  supplier?: Supplier | null;
  /** Mavjud kategoriyalar — tanlash uchun. */
  categories?: string[];
}

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  categories = [],
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const isEdit = Boolean(supplier);
  const isPending = createSupplier.isPending || updateSupplier.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      supplier
        ? {
            name: supplier.name,
            contactPerson: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email,
            category: supplier.category,
            address: supplier.address,
            rating: supplier.rating,
            status: supplier.status,
          }
        : EMPTY,
    );
  }, [open, supplier]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ta'minotchi nomi kiritilishi shart";
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
      contactPerson: form.contactPerson.trim(),
      phone: form.phone,
      email: form.email.trim(),
      category: form.category || "Boshqa",
      address: form.address.trim(),
      rating: form.rating,
    };

    try {
      if (supplier) {
        await updateSupplier.mutateAsync({
          id: supplier.id,
          ...payload,
          status: form.status,
        });
        toast.success("Ta'minotchi ma'lumotlari yangilandi");
      } else {
        await createSupplier.mutateAsync(payload);
        toast.success("Ta'minotchi muvaffaqiyatli qo'shildi");
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
            {isEdit ? "Ta'minotchini tahrirlash" : "Yangi ta'minotchi qo'shish"}
          </DialogTitle>
          <DialogDescription>
            Ta'minotchi ombordagi mahsulotlarga bog'lanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <TextField
            id="supplier-name"
            label="Ta'minotchi nomi"
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Masalan: Tech Supply"
          />
          <TextField
            id="supplier-contact"
            label="Aloqa shaxsi"
            value={form.contactPerson}
            onChange={(value) => setForm({ ...form, contactPerson: value })}
            placeholder="Masalan: Dilshod Ergashev"
          />
          <PhoneField
            id="supplier-phone"
            label="Telefon"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />
          <TextField
            id="supplier-email"
            label="Email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="info@supplier.uz"
          />

          <Field id="supplier-category" label="Kategoriya">
            <Select
              value={form.category || undefined}
              onValueChange={(value) => setForm({ ...form, category: value })}
            >
              <SelectTrigger id="supplier-category">
                <SelectValue placeholder="Kategoriyani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <TextField
            id="supplier-address"
            label="Manzil"
            value={form.address}
            onChange={(value) => setForm({ ...form, address: value })}
            placeholder="Ko'cha, uy raqami"
          />

          <Field id="supplier-rating" label="Baho">
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label="Baho"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={form.rating === value}
                  aria-label={`${value} yulduz`}
                  onClick={() => setForm({ ...form, rating: value })}
                  className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#4f947f]"
                >
                  <Star
                    size={22}
                    className={cn(
                      "transition",
                      value <= form.rating
                        ? "fill-[#e0a944] text-[#e0a944]"
                        : "text-slate-300",
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-500">
                {form.rating} / 5
              </span>
            </div>
          </Field>

          {isEdit && (
            <Field id="supplier-status" label="Holati">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as Supplier["status"] })
                }
              >
                <SelectTrigger id="supplier-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Arxivda</SelectItem>
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
