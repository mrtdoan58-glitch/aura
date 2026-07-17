import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness/readiness prob'u. Docker HEALTHCHECK ve yük dengeleyici tarafından kullanılır. */
export async function GET() {
  const health = {
    status: "ok" as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    env: process.env.NODE_ENV,
  };
  return NextResponse.json(health, { status: 200 });
}
