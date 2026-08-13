import { useState, useEffect } from "react";
import { PackageX } from "lucide-react";
import { Product, Supplier } from "@shared/api";
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
import { Textarea } from "@/components/ui/textarea";

interface ProductReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  products: Product[];
  defaultProductId?: string | null; // Auto-select mahsulot
  onSubmit: (data: {
    productId: string;
    quantity: number;
    reason: string;
    note: string;
  }) => void;
}

const RETURN_REASONS = [
  { value: "defective", label: "Nuqsonli mahsulot" },
  { value: "wrong_item", label: "Noto'g'ri mahsulot" },
  { value: "damaged", label: "Shikastlangan" },
  { value: "quality", label: "Sifat muammosi" },
  { value: "expired", label: "Muddati o'tgan" },
  { value: "other", label: "Boshqa sabab" },
];

export function ProductReturnDialog({
  open,
  onOpenChange,
  supplier,
  products,
  defaultProductId,
  onSubmit,
}: ProductReturnDialogProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-select mahsulot when dialog opens with defaultProductId
  useEffect(() => {
    if (open && defaultProductId) {
      setProductId(defaultProductId);
      setError("");
    } else if (!open) {
      // Reset form when dialog closes
      setProductId("");
      setQuantity("1");
      setReason("");
      setNote("");
      setError("");
    }
  }, [open, defaultProductId]);

  // Ta'minotchiga tegishli mahsulotlar
  const supplierProducts = supplier
    ? products.filter(
        (p) => p.supplier === supplier.name && !p.deletedAt && p.quantity > 0
      )
    : [];

  const selectedProduct = supplierProducts.find((p) => p.id === productId);
  const maxQuantity = selectedProduct?.quantity || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    console.log('🔍 [ProductReturnDialog] handleSubmit START:', {
      productId,
      quantity,
      reason,
      note,
    });

    // Validation
    if (!productId) {
      const msg = 'Mahsulotni tanlang';
      console.error('❌ [ProductReturnDialog]', msg);
      setError(msg);
      return;
    }
    
    if (!reason) {
      const msg = 'Qaytarish sababini tanlang';
      console.error('❌ [ProductReturnDialog]', msg);
      setError(msg);
      return;
    }

    const parsedQuantity = parseInt(quantity);
    if (!parsedQuantity || parsedQuantity < 1) {
      const msg = 'Miqdor kamida 1 bo\'lishi kerak';
      console.error('❌ [ProductReturnDialog]', msg);
      setError(msg);
      return;
    }

    if (parsedQuantity > maxQuantity) {
      const msg = `Omborda faqat ${maxQuantity} ta mahsulot mavjud`;
      console.error('❌ [ProductReturnDialog]', msg);
      setError(msg);
      return;
    }

    console.log('✅ [ProductReturnDialog] Validation passed');
    setIsSubmitting(true);
    
    try {
      console.log('📡 [ProductReturnDialog] Calling onSubmit...');
      await onSubmit({
        productId,
        quantity: parsedQuantity,
        reason,
        note,
      });
      console.log('✅ [ProductReturnDialog] onSubmit completed successfully');
      
      // Reset form
      setProductId("");
      setQuantity("1");
      setReason("");
      setNote("");
      setError("");
      onOpenChange(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Mahsulotni qaytarishda xatolik yuz berdi";
      console.error('❌ [ProductReturnDialog] onSubmit error:', error);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setProductId("");
      setQuantity("1");
      setReason("");
      setNote("");
      setError("");
    }
    onOpenChange(open);
  };

  const isFormValid = productId && reason && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="text-[#cb8535]" size={20} />
            Mahsulotni qaytarish
          </DialogTitle>
          <DialogDescription>
            {supplier ? (
              <>
                <b>{supplier.name}</b> ta'minotchiga mahsulot qaytaring. Ombor
                hisobidan mahsulot ayiriladi.
              </>
            ) : (
              "Ta'minotchi tanlanmagan"
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {supplierProducts.length === 0 ? (
          <div className="py-8 text-center">
            <PackageX size={48} className="mx-auto text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              Ushbu ta'minotchidan hech qanday mahsulot topilmadi yoki barcha
              mahsulotlar tugagan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mahsulot tanlash */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Mahsulot <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={productId} 
                onValueChange={(value) => {
                  console.log('📝 [ProductReturnDialog] Product selected:', value);
                  setProductId(value);
                  setError("");
                }}
                required
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Mahsulotni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {supplierProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Mavjud: {product.quantity} ta)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Soni */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Soni <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  console.log('📝 [ProductReturnDialog] Quantity changed:', e.target.value);
                  setQuantity(e.target.value);
                  setError("");
                }}
                placeholder="Qaytariladigan mahsulot soni"
                required
                disabled={!productId}
              />
              {selectedProduct && (
                <p className="text-xs text-slate-400">
                  Maksimal: {maxQuantity} ta
                </p>
              )}
            </div>

            {/* Qaytarish sababi */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Qaytarish sababi <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={reason} 
                onValueChange={(value) => {
                  console.log('📝 [ProductReturnDialog] Reason selected:', value);
                  setReason(value);
                  setError("");
                }}
                required
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Sababni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Izoh */}
            <div className="space-y-2">
              <Label htmlFor="note">Qo'shimcha izoh</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Qaytarish haqida batafsil ma'lumot..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="bg-[#cb8535] hover:bg-[#b5761f]"
              >
                {isSubmitting ? "Qaytarilmoqda..." : "Qaytarish"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="text-[#cb8535]" size={20} />
            Mahsulotni qaytarish
          </DialogTitle>
          <DialogDescription>
            {supplier ? (
              <>
                <b>{supplier.name}</b> ta'minotchiga mahsulot qaytaring. Ombor
                hisobidan mahsulot ayiriladi.
              </>
            ) : (
              "Ta'minotchi tanlanmagan"
            )}
          </DialogDescription>
        </DialogHeader>

        {supplierProducts.length === 0 ? (
          <div className="py-8 text-center">
            <PackageX size={48} className="mx-auto text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              Ushbu ta'minotchidan hech qanday mahsulot topilmadi yoki barcha
              mahsulotlar tugagan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mahsulot tanlash */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Mahsulot <span className="text-red-500">*</span>
              </Label>
              <Select value={productId} onValueChange={setProductId} required>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Mahsulotni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {supplierProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Mavjud: {product.quantity} ta)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Soni */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Soni <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qaytariladigan mahsulot soni"
                required
                disabled={!productId}
              />
              {selectedProduct && (
                <p className="text-xs text-slate-400">
                  Maksimal: {maxQuantity} ta
                </p>
              )}
            </div>

            {/* Qaytarish sababi */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Qaytarish sababi <span className="text-red-500">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Sababni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Izoh */}
            <div className="space-y-2">
              <Label htmlFor="note">Qo'shimcha izoh</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Qaytarish haqida batafsil ma'lumot..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                disabled={!productId || !reason || isSubmitting}
                className="bg-[#cb8535] hover:bg-[#b5761f]"
              >
                {isSubmitting ? "Qaytarilmoqda..." : "Qaytarish"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
