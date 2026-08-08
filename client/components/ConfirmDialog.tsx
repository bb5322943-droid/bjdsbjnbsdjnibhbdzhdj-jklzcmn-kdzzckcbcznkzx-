import { ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmText?: string;
  /** Qaytmas amallar (o'chirish) qizil tugma bilan ko'rsatiladi. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Qaytmas amallar uchun tasdiqlash oynasi.
 * Brauzerning `confirm()` funksiyasi o'rniga — u dizayn bilan mos kelmaydi
 * va mobil brauzerlarda bloklanishi mumkin.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Tasdiqlash",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Xatoni shu yerda ushlaymiz: oyna ochiq qoladi va foydalanuvchi qayta urinishi
      // mumkin. Shu sababli chaqiruvchi sahifalar o'zi try/catch yozishi shart emas.
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Bekor qilish
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Radix oynani darhol yopadi — so'rov tugagunicha ochiq turishi kerak.
              event.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className={
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#173f38] hover:bg-[#0f312b]"
            }
          >
            {isPending ? "Bajarilmoqda..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
