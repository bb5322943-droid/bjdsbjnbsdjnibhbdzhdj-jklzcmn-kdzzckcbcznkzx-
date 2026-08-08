import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Product } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoneyField, TextField } from "@/components/FormField";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/format";

const EMPTY = {
  name: "",
  location: "",
  quantity: "",
  minQuantity: "",
  price: "",
  category: "",
  supplier: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa — tahrirlash rejimi. */
  product?: Product | null;
  /** Default ombor nomi (yangi mahsulot qo'shganda). */
  defaultLocation?: string;
}

export function ProductDialog({ open, onOpenChange, product, defaultLocation }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = Boolean(product);
  const isPending = createProduct.isPending || updateProduct.isPending;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      product
        ? {
            name: product.name,
            location: product.location,
            quantity: product.quantity.toString(),
            minQuantity: product.minQuantity.toString(),
            price: product.price.toString(),
            category: product.category,
            supplier: product.supplier,
          }
        : {
            ...EMPTY,
            location: defaultLocation || "",
          },
    );
  }, [open, product, defaultLocation]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Mahsulot nomi kiritilishi shart";
    if (form.quantity === "" || Number(form.quantity) < 0)
      next.quantity = "Qoldiq 0 yoki undan katta bo'lishi kerak";
    if (!form.price || Number(form.price) <= 0)
      next.price = "Narx noldan katta bo'lishi kerak";
    if (form.minQuantity !== "" && Number(form.minQuantity) < 0)
      next.minQuantity = "Minimal qoldiq manfiy bo'lishi mumkin emas";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      location: form.location.trim() || "Asosiy ombor",
      quantity: Number(form.quantity),
      minQuantity: Number(form.minQuantity) || 10,
      price: Number(form.price),
      category: form.category.trim() || "Boshqa",
      supplier: form.supplier.trim() || "Noma'lum",
    };

    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...payload });
        toast.success("Mahsulot ma'lumotlari yangilandi");
      } else {
        await createProduct.mutateAsync(payload);
        toast.success("Mahsulot muvaffaqiyatli qo'shildi");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  };

  const totalValue = Number(form.quantity) * Number(form.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
          </DialogTitle>
          <DialogDescription>
            Qoldiq minimal chegaradan pastga tushsa, mahsulot tanqis deb
            belgilanadi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <TextField
            id="product-name"
            label="Mahsulot nomi"
            required
            value={form.name}
            error={errors.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Masalan: A4 qog'oz, 80 gr"
          />
          <TextField
            id="category"
            label="Kategoriya"
            value={form.category}
            onChange={(value) => setForm({ ...form, category: value })}
            placeholder="Masalan: Ofis jihozlari"
          />
          <TextField
            id="location"
            label="Ombor"
            value={form.location}
            onChange={(value) => setForm({ ...form, location: value })}
            placeholder="Masalan: Asosiy ombor"
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="quantity"
              label="Qoldiq"
              required
              type="number"
              min={0}
              value={form.quantity}
              error={errors.quantity}
              onChange={(value) => setForm({ ...form, quantity: value })}
              placeholder="0"
            />
            <TextField
              id="minQuantity"
              label="Minimal qoldiq"
              type="number"
              min={0}
              value={form.minQuantity}
              error={errors.minQuantity}
              onChange={(value) => setForm({ ...form, minQuantity: value })}
              placeholder="10"
            />
          </div>

          <MoneyField
            id="price"
            label="Narx"
            required
            value={form.price}
            error={errors.price}
            onChange={(value) => setForm({ ...form, price: value })}
          />
          <TextField
            id="supplier"
            label="Ta'minotchi"
            value={form.supplier}
            onChange={(value) => setForm({ ...form, supplier: value })}
            placeholder="Masalan: Paper Plus"
          />

          {totalValue > 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Umumiy qiymat:{" "}
              <b className="text-slate-700">{formatCurrency(totalValue)}</b>
            </p>
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
