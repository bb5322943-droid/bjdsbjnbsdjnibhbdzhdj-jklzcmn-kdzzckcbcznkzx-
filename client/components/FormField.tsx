import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatUzPhone, groupDigits, normalizeUzPhone } from "@/lib/format";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  /** Validatsiya xatosi — maydon ostida qizil matn bilan ko'rsatiladi. */
  error?: string;
  children?: ReactNode;
}

/**
 * Dialog formalaridagi maydonlar uchun umumiy o'ram:
 * yorliq, majburiylik belgisi va xato xabari bir xil ko'rinishda bo'ladi.
 */
export function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends FieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "number" | "date" | "tel";
  /** Raqamli maydon uchun eng kichik qiymat yoki sana maydoni uchun eng erta sana. */
  min?: number | string;
}

export function TextField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}: TextFieldProps) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <Input
        id={id}
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={
          error ? "border-red-400 focus-visible:ring-red-400" : undefined
        }
      />
    </Field>
  );
}

interface MoneyFieldProps extends FieldProps {
  /** Xom raqamlar satri, masalan "1000000". */
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
}

/**
 * Pul kiritish maydoni: foydalanuvchi yozayotganda "1,000,000" ko'rinishida
 * ajratib ko'rsatadi, lekin holatda faqat xom raqamlarni saqlaydi.
 * Faqat raqam qabul qiladi.
 */
export function MoneyField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  placeholder = "0",
}: MoneyFieldProps) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          value={groupDigits(value)}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`pr-12 ${error ? "border-red-400 focus-visible:ring-red-400" : ""}`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          so'm
        </span>
      </div>
    </Field>
  );
}

interface PhoneFieldProps extends FieldProps {
  /** Normal ko'rinish, masalan "+998901234567" yoki bo'sh satr. */
  value: string;
  onChange: (normalized: string) => void;
}

/**
 * Telefon maydoni: faqat raqam qabul qiladi va "+998 XX XXX XX XX" shaklida
 * ko'rsatadi. Bo'sh bo'lganda placeholder o'sha niqobni ko'rsatadi.
 */
export function PhoneField({
  id,
  label,
  required,
  error,
  value,
  onChange,
}: PhoneFieldProps) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <Input
        id={id}
        inputMode="tel"
        value={formatUzPhone(value)}
        onChange={(event) => onChange(normalizeUzPhone(event.target.value))}
        placeholder="+998 XX XXX XX XX"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={
          error ? "border-red-400 focus-visible:ring-r ed-400" : undefined
        }
      />
    </Field>
  );
}

interface SelectFieldProps extends FieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * Tanlash maydoni: ro'yxatdan birini tanlash uchun.
 */
export function SelectField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder = "Tanlang...",
}: SelectFieldProps) {
  return (
    <Field id={id} label={label} required={required} error={error}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={
            error ? "border-red-400 focus:ring-red-400" : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
