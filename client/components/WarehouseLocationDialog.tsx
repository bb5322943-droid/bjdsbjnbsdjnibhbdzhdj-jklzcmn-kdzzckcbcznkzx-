import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreateBranch, useUpdateBranch } from "@/hooks/use-api";
import { toast } from "sonner";

interface WarehouseLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: { id: string; name: string } | null;
}

/**
 * Ombor joylashuvi qo'shish/tahrirlash dialog
 * Faqat eng kerakli maydonlar - oddiy va tez
 */
export function WarehouseLocationDialog({
  open,
  onOpenChange,
  location,
}: WarehouseLocationDialogProps) {
  const [form, setForm] = useState({
    name: "",
    region: "",
    address: "",
    manager: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const isEdit = Boolean(location);

  useEffect(() => {
    if (location) {
      setForm({
        name: location.name || "",
        region: "",
        address: "",
        manager: "",
        phone: "",
      });
    } else {
      setForm({
        name: "",
        region: "",
        address: "",
        manager: "",
        phone: "",
      });
    }
    setErrors({});
  }, [location, open]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ombor nomi kiritilishi shart";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        name: form.name.trim(),
        type: "branch" as const,
        region: form.region.trim() || "Toshkent shahri",
        address: form.address.trim() || "—",
        phone: form.phone.trim() || "+998 00 000 00 00",
        manager: form.manager.trim() || "—",
        status: "active" as const,
        note: "warehouse", // ← Ombor belgisi
      };

      if (isEdit && location) {
        await updateBranch.mutateAsync({
          id: location.id,
          ...payload,
        });
        toast.success("Ombor joylashuvi yangilandi");
      } else {
        await createBranch.mutateAsync(payload);
        toast.success("Yangi ombor joylashuvi qo'shildi");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message ?? "Xatolik yuz berdi");
    }
  };

  const regions = [
    "Toshkent shahri",
    "Toshkent viloyati",
    "Samarqand",
    "Buxoro",
    "Farg'ona",
    "Andijon",
    "Namangan",
    "Qashqadaryo",
    "Surxondaryo",
    "Xorazm",
    "Navoiy",
    "Jizzax",
    "Sirdaryo",
    "Qoraqalpog'iston",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ombor joylashuvini tahrirlash" : "Yangi ombor joylashuvi"}
          </DialogTitle>
          <DialogDescription>
            Ombor yoki do'kon joylashuvini qo'shing. Bu yerda mahsulotlar saqlanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">
              Ombor nomi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masalan: Asosiy ombor, Samsung bo'limi"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-region">Hudud</Label>
            <Select value={form.region} onValueChange={(value) => setForm({ ...form, region: value })}>
              <SelectTrigger id="location-region">
                <SelectValue placeholder="Hududni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location-address">Manzil</Label>
            <Input
              id="location-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ko'cha, uy raqami"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location-manager">Mas'ul shaxs</Label>
              <Input
                id="location-manager"
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                placeholder="Ism familiya"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-phone">Telefon</Label>
              <Input
                id="location-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+998 XX XXX XX XX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={createBranch.isPending || updateBranch.isPending}
              className="bg-[#173f38] hover:bg-[#0f312b]"
            >
              {createBranch.isPending || updateBranch.isPending
                ? "Saqlanmoqda..."
                : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
