import { fileURLToPath } from "node:url";
import path from "node:path";

// Üst dizinlerde ilgisiz bir package-lock.json bulunursa Next.js workspace root'u
// yanlış algılayıp standalone çıktısını (server.js) beklenmedik bir yere iç içe koyabilir.
// Root'u projenin kendi dizinine sabitliyoruz.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' https://images.unsplash.com https://i.pravatar.cc data: blob:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  experimental: { cpus: 1, workerThreads: false },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

// Bundle analyzer yalnızca ANALYZE=true iken (opsiyonel bağımlılık)
let config = baseConfig;
if (process.env.ANALYZE === "true") {
  const { default: withBundleAnalyzer } = await import("@next/bundle-analyzer");
  config = withBundleAnalyzer({ enabled: true, openAnalyzer: false })(baseConfig);
}

export default config;
