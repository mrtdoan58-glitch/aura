import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/** Auth ekranları için ortak kabuk: solda marka paneli, sağda kart. Tam responsive. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Marka paneli — yalnızca lg+ */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[radial-gradient(130%_100%_at_0%_0%,#2563EB,#4F46E5_45%,#1e1b4b)] p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </span>
          Aura
        </Link>
        <div>
          <h2 className="text-[34px] font-extrabold leading-tight tracking-tight">
            Anlarını paylaş.
            <br />
            Topluluğunu keşfet.
          </h2>
          <p className="mt-4 max-w-sm text-white/75">
            Premium, minimal ve güvenli bir sosyal deneyim. Verilerin şifreli, oturumların senin kontrolünde.
          </p>
        </div>
        <p className="text-sm text-white/50">© {new Date().getFullYear()} Aura</p>
      </aside>

      {/* Form kolonu */}
      <main className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-extrabold lg:hidden">
            <span className="story-ring grid h-9 w-9 place-items-center rounded-[10px]">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            Aura
          </Link>
          <h1 className="text-[26px] font-extrabold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[14.5px] text-fg-2">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-center text-[14px] text-fg-2">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
