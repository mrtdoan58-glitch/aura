"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(({ label, error, id, className, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-bold text-fg-2">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "w-full rounded-[14px] border bg-surface px-4 py-3 text-[14.5px] text-fg outline-none transition-all placeholder:text-fg-3 focus:ring-4",
          error ? "border-danger focus:ring-danger/15" : "border-border focus:border-primary focus:ring-[var(--ring)]",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-[12.5px] font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
TextField.displayName = "TextField";

export const PasswordField = forwardRef<HTMLInputElement, FieldProps & { showStrength?: boolean; value?: string }>(
  ({ label, error, id, showStrength, value, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;
    return (
      <div className="mb-4">
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-bold text-fg-2">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={!!error}
            className={cn(
              "w-full rounded-[14px] border bg-surface px-4 py-3 pr-11 text-[14.5px] text-fg outline-none transition-all placeholder:text-fg-3 focus:ring-4",
              error ? "border-danger focus:ring-danger/15" : "border-border focus:border-primary focus:ring-[var(--ring)]",
              className
            )}
            // `value` yalnızca çağıran taraf açıkça geçtiğinde (ör. güç göstergesi
            // için) controlled olur; aksi halde react-hook-form'un ref tabanlı
            // uncontrolled kullanımına bırakılır. Sabit bir varsayılan (`= ""`)
            // input'u her zaman controlled yapıp kullanıcı girişini geri alıyordu.
            value={value}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg"
            aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
        {showStrength && (value ?? "").length > 0 && <PasswordStrength value={value ?? ""} />}
        {error && (
          <p className="mt-1.5 text-[12.5px] font-medium text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";

export function passwordScore(v: string): number {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return s;
}

function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const labels = ["Çok zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];
  const colors = ["bg-danger", "bg-danger", "bg-warning", "bg-primary", "bg-success"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < score ? colors[score] : "bg-surface-2")} />
        ))}
      </div>
      <p className="mt-1 text-[11.5px] font-medium text-fg-3">{labels[score]}</p>
    </div>
  );
}

export function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-1.5 text-[12px]", met ? "text-success" : "text-fg-3")}>
      {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {children}
    </li>
  );
}
