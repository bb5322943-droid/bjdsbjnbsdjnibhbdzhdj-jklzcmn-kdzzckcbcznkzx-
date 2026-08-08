import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DetailField {
  label: string;
  value: ReactNode;
  /** Uzun matnlar uchun — qator bo'ylab to'liq joy egallaydi. */
  full?: boolean;
}

export interface DetailSection {
  title?: string;
  fields: DetailField[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  /** Sarlavha ostidagi belgilar — holat va bosqich uchun. */
  badges?: ReactNode;
  sections: DetailSection[];
  /** Jadval yoki ro'yxat kabi qo'shimcha blok (masalan buyurtma qatorlari). */
  children?: ReactNode;
  /** Pastdagi qo'shimcha tugmalar (masalan "Tahrirlash"). */
  actions?: ReactNode;
}

/**
 * Yozuvni faqat ko'rish uchun oyna — barcha bo'limlarda bir xil ko'rinish.
 * Maydonlar ikki ustunga joylashadi; `full` berilgan maydon butun qatorni egallaydi.
 */
export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  badges,
  sections,
  children,
  actions,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        {badges && (
          <div className="flex flex-wrap items-center gap-2">{badges}</div>
        )}

        <div className="space-y-5 py-2">
          {sections.map((section, index) => (
            <div key={section.title ?? index}>
              {section.title && (
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[.1em] text-slate-400">
                  {section.title}
                </p>
              )}
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div
                    key={field.label}
                    className={field.full ? "sm:col-span-2" : undefined}
                  >
                    <dt className="text-xs text-slate-400">{field.label}</dt>
                    <dd className="mt-0.5 break-words text-sm font-medium text-slate-700">
                      {field.value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {children}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {actions}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Yopish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
