"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Check, ImagePlus, MapPin, ChevronDown, Save, Send } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";

const schema = z.object({
  caption: z.string().min(1, "Başlık gerekli").max(2200),
  tags: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreatePage() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { caption: "", tags: "" } });

  const onSubmit = () => {
    showToast("Paylaşımın yayınlandı");
    setTimeout(() => router.push("/"), 700);
  };

  return (
    <AppShell>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-4">
          <button type="button" onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Kapat">
            <X className="h-[23px] w-[23px]" />
          </button>
          <h2 className="text-[19px] font-extrabold tracking-tight">Yeni Paylaşım</h2>
          <button type="submit" className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-surface-2" aria-label="Yayınla">
            <Check className="h-[23px] w-[23px]" />
          </button>
        </header>

        <button
          type="button"
          onClick={() => showToast("Medya seçici açılıyor")}
          className="mx-5 my-4.5 flex w-[calc(100%-40px)] flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-border bg-surface p-10 text-center transition-all hover:border-primary hover:bg-surface-2"
        >
          <span className="story-ring grid h-16 w-16 place-items-center rounded-[20px] shadow-[0_8px_22px_rgba(79,70,229,0.35)]">
            <ImagePlus className="h-[30px] w-[30px] text-white" />
          </span>
          <span className="text-base font-bold">Medya ekle</span>
          <span className="max-w-[220px] text-[13px] text-fg-2">
            Sürükle bırak ya da dokunarak fotoğraf ve video yükle
          </span>
        </button>

        <Field label="Başlık" error={errors.caption?.message}>
          <textarea
            {...register("caption")}
            placeholder="Bir şeyler yaz..."
            className="h-[88px] w-full resize-none rounded-[16px] border border-border bg-surface px-4 py-3.5 text-[14.5px] outline-none focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
          />
        </Field>
        <Field label="Etiketler">
          <input
            {...register("tags")}
            placeholder="#tasarım  #minimal  #premium"
            className="w-full rounded-[16px] border border-border bg-surface px-4 py-3.5 text-[14.5px] outline-none focus:border-primary focus:ring-4 focus:ring-[var(--ring)]"
          />
        </Field>
        <Field label="Konum">
          <button type="button" onClick={() => showToast("Konum seçici")} className="flex w-full items-center justify-between rounded-[16px] border border-border bg-surface px-4 py-3.5 text-[14.5px] text-fg-2">
            <span>Konum ekle</span>
            <MapPin className="h-[19px] w-[19px]" />
          </button>
        </Field>
        <Field label="Kategori">
          <button type="button" onClick={() => showToast("Kategori seçici")} className="flex w-full items-center justify-between rounded-[16px] border border-border bg-surface px-4 py-3.5 text-[14.5px] text-fg-2">
            <span>Sanat &amp; Tasarım</span>
            <ChevronDown className="h-[19px] w-[19px]" />
          </button>
        </Field>

        <div className="flex gap-3 px-5 pb-6 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => showToast("Taslak kaydedildi")}>
            <Save className="h-[18px] w-[18px]" /> Taslak
          </Button>
          <Button type="submit" className="flex-1">
            <Send className="h-[18px] w-[18px]" /> Yayınla
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 px-5">
      <label className="mb-2 block text-[13px] font-bold text-fg-2">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-[12.5px] font-medium text-danger">{error}</p>}
    </div>
  );
}
