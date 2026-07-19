"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center bg-white text-center antialiased">
        <div className="px-6">
          <h1 className="text-lg font-semibold text-gray-900">Bir şeyler ters gitti</h1>
          <p className="mt-2 text-sm text-gray-500">
            Beklenmedik bir hata oluştu. Sayfayı yenilemeyi deneyebilirsin.
          </p>
        </div>
      </body>
    </html>
  );
}
