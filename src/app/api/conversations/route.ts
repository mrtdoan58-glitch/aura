import { NextResponse } from "next/server";
import { getMessagingService } from "@/server/messaging/container";
import { getCurrentUser } from "@/server/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ conversations: [] });
  const conversations = await getMessagingService().listConversations(user.id);
  return NextResponse.json({ conversations });
}
