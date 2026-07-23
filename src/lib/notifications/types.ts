import type { AuthorDTO } from "@/lib/feed/types";

export type NotificationTypeDTO = "FOLLOW" | "LIKE" | "COMMENT";

export interface NotificationDTO {
  id: string;
  actor: AuthorDTO;
  type: NotificationTypeDTO;
  postId: string | null;
  postImageUrl: string | null;
  commentText: string | null;
  read: boolean;
  createdAt: string;
  viewerFollowsActor: boolean;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  unreadCount: number;
}
