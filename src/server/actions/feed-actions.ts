"use server";

/**
 * Feed mutation action'ları. Kimlik doğrulama zorunlu; hata tek tip zarfta döner.
 * (Next Server Actions yerleşik origin/CSRF korumasına sahiptir.)
 */
import { getFeedService, FeedError } from "@/server/feed/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { Comment } from "@/server/feed/domain";
import type { CommentDTO } from "@/lib/feed/types";

function toDTO(c: Comment): CommentDTO {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

async function requireAuthor() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl ?? "https://i.pravatar.cc/200?img=68",
    verified: user.role !== "USER",
  };
}

export async function toggleLikeAction(
  postId: string,
  liked: boolean
): Promise<ActionResult<{ liked: boolean; likeCount: number }>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const res = await getFeedService().setLike(postId, author.id, liked);
    return { ok: true, data: res };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function toggleSaveAction(postId: string, saved: boolean): Promise<ActionResult<{ saved: boolean }>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const res = await getFeedService().setSave(postId, author.id, saved);
    return { ok: true, data: res };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function addCommentAction(postId: string, text: string): Promise<ActionResult<CommentDTO>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const comment = await getFeedService().addComment(postId, author, text);
    return { ok: true, data: toDTO(comment) };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function markStorySeenAction(storyId: string): Promise<ActionResult<null>> {
  const author = await requireAuthor();
  if (!author) return { ok: true, data: null };
  await getFeedService().markStorySeen(storyId, author.id);
  return { ok: true, data: null };
}
