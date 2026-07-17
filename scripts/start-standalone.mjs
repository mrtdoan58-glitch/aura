// `next start`, `output: "standalone"` (Dockerfile'ın kullandığı build modu) ile uyumlu
// değildir — Next.js bunu doğrudan reddeder. E2E/Playwright de üretimdekiyle aynı
// sunucu şeklini kullansın diye, Dockerfile'daki kopyalama adımlarını burada tekrarlayıp
// `.next/standalone/server.js`'i başlatıyoruz.
import { existsSync, cpSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const serverEntry = path.join(standaloneDir, "server.js");

if (!existsSync(serverEntry)) {
  console.error(`[start-standalone] ${serverEntry} bulunamadı. Önce "npm run build" çalıştırın.`);
  process.exit(1);
}

const publicDir = path.join(root, "public");
if (existsSync(publicDir)) cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });
cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), { recursive: true });

const child = spawn(process.execPath, [serverEntry], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
