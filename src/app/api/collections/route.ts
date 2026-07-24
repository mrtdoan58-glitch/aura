import { NextResponse } from "next/server";
import { getFeedService } from "@/server/feed/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ collections: [] });
  const collections = await getFeedService().listCollections(user.id);
  return NextResponse.json({ collections });
}
