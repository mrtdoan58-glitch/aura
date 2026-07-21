"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Check, ImagePlus, MapPin, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { usePostActions } from "@/hooks/use-post-actions";

const MAX_MEDIA = 10;

const schema = z.object({
  caption: z.string().min(1, "Başlık gerekli").max(2200),
  tags: z.string().optional(),
  location: z.string().max(120).optional(),
});
type FormValues = z.infer<typeof schema>;

interface PickedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export default function CreatePage() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { create } = usePostActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { caption: "", tags: "", location: "" } });

  async function readDimensions(file: File): Promise<{ width: number; height: number }> {
    const url = URL.createObjectURL(file);
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      // Önizleme URL'i ayrı tutuluyor (aşağıda), burada yalnızca ölçüm için oluşturulan geçici URL serbest bırakılır.
      URL.revokeObjectURL(url);
    }
  }

  async function onPickFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setMediaError("Yalnızca resim dosyaları desteklenir.");
      return;
    }
    if (images.length + files.length > MAX_MEDIA) {
      setMediaError(`En fazla ${MAX_MEDIA} fotoğraf ekleyebilirsin.`);
      return;
    }
    setMediaError(null);
    const picked = await Promise.all(
      files.map(async (file) => {
        const { width, height } = await readDimensions(file);
        return { file, previewUrl: URL.createObjectURL(file), width, height };
      })
    );
    setImages((prev) => [...prev, ...picked]);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  const onSubmit = async (values: FormValues) => {
    if (images.length === 0) {
      setMediaError("En az bir fotoğraf eklemelisin.");
      return;
    }
    const fd = new FormData();
    fd.set("caption", values.caption);
    fd.set("tags", values.tags ?? "");
    fd.set("location", values.location ?? "");
    for (const img of images) {
      fd.append("media", img.file);
      fd.append("width", String(img.width));
      fd.append("height", String(img.height));
    }
    const res = await create.mutateAsync(fd);
    if (res.ok) {
      showToast("Paylaşımın yayınlandı");
      router.push("/");
    } else {
      showToast(res.error ?? "Paylaşım yayınlanamadı");
    }
  };

  return (
    <AppShell>
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-[500px]">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border px-5 py-4">
          <button type="button" onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2" aria-label="Kapat">
            <X className="h-[23px] w-[23px]" />
          </button>
          <h2 className="text-[19px] font-extrabold tracking-tight">Yeni Paylaşım</h2>
          <button type="submit" disabled={create.isPending} className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-surface-2 disabled:opacity-40" aria-label="Yayınla">
            {create.isPending ? <Loader2 className="h-[23px] w-[23px] animate-spin" /> : <Check className="h-[23px] w-[23px]" />}
          </button>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            void onPickFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mx-5 my-4.5 flex w-[calc(100%-40px)] flex-col items-center gap-3 rounded-[22px] border-2 border-dashed border-border bg-surface p-10 text-center transition-all hover:border-primary hover:bg-surface-2"
          >
            <span className="story-ring grid h-16 w-16 place-items-center rounded-[20px] shadow-[0_8px_22px_rgba(79,70,229,0.35)]">
              <ImagePlus className="h-[30px] w-[30px] text-white" />
            </span>
            <span className="text-base font-bold">Medya ekle</span>
            <span className="max-w-[220px] text-[13px] text-fg-2">Dokunarak fotoğraf yükle</span>
          </button>
        ) : (
          <div className="mx-5 my-4.5 grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={img.previewUrl} className="relative aspect-square overflow-hidden rounded-[14px] bg-surface-2">
                <Image src={img.previewUrl} alt="" fill unoptimized className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Fotoğrafı kaldır"
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {images.length < MAX_MEDIA && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Daha fazla fotoğraf ekle"
                className="grid aspect-square place-items-center rounded-[14px] border-2 border-dashed border-border bg-surface text-fg-2 hover:border-primary"
              >
                <ImagePlus className="h-6 w-6" />
              </button>
            )}
          </div>
        )}
        {mediaError && <p className="mx-5 -mt-3 mb-3 text-[12.5px] font-medium text-danger">{mediaError}</p>}

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
          <div className="flex w-full items-center gap-2 rounded-[16px] border border-border bg-surface px-4 py-3.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-[var(--ring)]">
            <MapPin className="h-[19px] w-[19px] shrink-0 text-fg-2" />
            <input
              {...register("location")}
              placeholder="Konum ekle"
              className="w-full bg-transparent text-[14.5px] outline-none"
            />
          </div>
        </Field>

        <div className="px-5 pb-6 pt-2">
          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
            Yayınla
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
