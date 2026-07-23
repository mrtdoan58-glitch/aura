import { NextResponse, type NextRequest } from "next/server";
import { getNotificationService } from "@/server/notifications/container";
import { getCurrentUser } from "@/server/auth/current-user";
import type { NotificationListDTO } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [], unreadCount: 0 } satisfies NotificationListDTO);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 40);
  const result = await getNotificationService().list(user.id, { limit });
  const payload: NotificationListDTO = {
    unreadCount: result.unreadCount,
    items: result.items.map((n) => ({
      id: n.id,
      actor: n.actor,
      type: n.type,
      postId: n.postId,
      postImageUrl: n.postImageUrl,
      commentText: n.commentText,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      viewerFollowsActor: n.viewerFollowsActor,
    })),
  };
  return NextResponse.json(payload);
}
