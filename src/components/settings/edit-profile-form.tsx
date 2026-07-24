"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { updateProfileAction } from "@/server/actions/settings-actions";

interface Props {
  initial: { name: string; username: string; avatarUrl: string };
}

export function EditProfileForm({ initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [username, setUsername] = useState(initial.username);
  const [preview, setPreview] = useState(initial.avatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const showToast = useUIStore((s) => s.showToast);
  const router = useRouter();

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = () => {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("username", username);
    if (file) fd.set("avatar", file);
    startTransition(async () => {
      const res = await updateProfileAction(fd);
      if (res.ok) {
        showToast("Profil güncellendi");
        router.push(`/profile/${res.data?.username ?? username}`);
      } else {
        setError(res.error ?? "Güncellenemedi.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-[104px] w-[104px] overflow-hidden rounded-[32px] border-4 border-bg shadow-md"
        >
          <Image src={preview} alt="" width={104} height={104} className="h-full w-full object-cover" unoptimized />
          <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </span>
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-bold text-primary">
          Fotoğrafı değiştir
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <Field label="İsim">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14.5px] outline-none focus:border-primary"
        />
      </Field>

      <Field label="Kullanıcı adı">
        <div className="flex items-center rounded-xl border border-border bg-surface px-4 focus-within:border-primary">
          <span className="text-[14.5px] text-fg-3">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            maxLength={24}
            className="flex-1 bg-transparent px-1 py-3 text-[14.5px] outline-none"
          />
        </div>
      </Field>

      {error && <p className="text-[13.5px] font-medium text-danger">{error}</p>}

      <Button className="w-full" disabled={pending} onClick={submit}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-fg-2">{label}</span>
      {children}
    </label>
  );
}
