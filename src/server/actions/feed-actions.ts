"use server";

/**
 * Feed mutation action'ları. Kimlik doğrulama zorunlu; hata tek tip zarfta döner.
 * (Next Server Actions yerleşik origin/CSRF korumasına sahiptir.)
 */
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { getFeedService, FeedError } from "@/server/feed/container-actions";
import { notify } from "@/server/notifications/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { Comment, Post, Story, NewPostMedia } from "@/server/feed/domain";
import type { CommentDTO, PostDTO, StoryDTO, CollectionDTO } from "@/lib/feed/types";

function toDTO(c: Comment): CommentDTO {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

function toPostDTO(p: Post): PostDTO {
  return { ...p, createdAt: p.createdAt.toISOString(), likedByMe: false, savedByMe: false };
}

function toStoryDTO(s: Story): StoryDTO {
  return { ...s, createdAt: s.createdAt.toISOString(), expiresAt: s.expiresAt.toISOString() };
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

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
    if (liked) {
      // Gönderi sahibine bildirim (kendi beğenisi hariç). Best-effort; hata like'ı bozmaz.
      try {
        const post = await getFeedService().getPost(postId, null);
        if (post.author.id !== author.id) {
          await notify({ recipientId: post.author.id, actor: author, type: "LIKE", postId, postImageUrl: post.media[0]?.url ?? null });
        }
      } catch {
        /* bildirim best-effort */
      }
    }
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

/* --------------------------- Koleksiyonlar --------------------------- */
export async function createCollectionAction(name: string): Promise<ActionResult<CollectionDTO>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const c = await getFeedService().createCollection(author.id, name);
    return { ok: true, data: { ...c, createdAt: c.createdAt.toISOString() } };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function deleteCollectionAction(collectionId: string): Promise<ActionResult<null>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    await getFeedService().deleteCollection(author.id, collectionId);
    return { ok: true, data: null };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

/** Kaydedilmiş gönderiyi koleksiyona taşı (null = koleksiyondan çıkar). */
export async function setPostCollectionAction(postId: string, collectionId: string | null): Promise<ActionResult<null>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    await getFeedService().setPostCollection(author.id, postId, collectionId);
    return { ok: true, data: null };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function toggleCommentLikeAction(commentId: string, liked: boolean): Promise<ActionResult<{ liked: boolean }>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const res = await getFeedService().setCommentLike(commentId, author.id, liked);
    return { ok: true, data: res };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

export async function addCommentAction(postId: string, text: string, parentId?: string | null): Promise<ActionResult<CommentDTO>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };
  try {
    const comment = await getFeedService().addComment(postId, author, text, parentId);
    // Bildirim yalnızca üst-seviye yorumda gönderi sahibine (yanıtlarda değil).
    if (!parentId) {
      try {
        const post = await getFeedService().getPost(postId, null);
        if (post.author.id !== author.id) {
          await notify({ recipientId: post.author.id, actor: author, type: "COMMENT", postId, postImageUrl: post.media[0]?.url ?? null, commentText: text.slice(0, 140) });
        }
      } catch {
        /* bildirim best-effort */
      }
    }
    return { ok: true, data: toDTO(comment) };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

/**
 * `media`, `width`, `height` alanları FormData'da eşleşen sırayla, üçlü olarak
 * eklenir (bkz. create/page.tsx) — her dosyanın boyutu tarayıcıda önizleme
 * sırasında zaten okunuyor, sunucuda tekrar görsel işlemeye (ör. sharp) gerek
 * kalmaması için client'tan taşınıyor.
 */
export async function createPostAction(formData: FormData): Promise<ActionResult<PostDTO>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };

  const caption = (formData.get("caption") as string | null) ?? "";
  const tagsRaw = (formData.get("tags") as string | null) ?? "";
  const location = (formData.get("location") as string | null)?.trim() || null;
  const tags = [...new Set(tagsRaw.split(/[\s,#]+/).map((t) => t.trim()).filter(Boolean))];

  const files = formData.getAll("media").filter((v): v is File => v instanceof File);
  const widths = formData.getAll("width").map(Number);
  const heights = formData.getAll("height").map(Number);

  if (files.length === 0) return { ok: false, error: "En az bir fotoğraf gerekli.", code: "INVALID_INPUT" };
  if (files.length > 10) return { ok: false, error: "En fazla 10 medya eklenebilir.", code: "INVALID_INPUT" };
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Yalnızca resim dosyaları desteklenir.", code: "INVALID_INPUT" };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: "Dosya çok büyük (en fazla 10MB).", code: "INVALID_INPUT" };
    }
  }

  try {
    const media: NewPostMedia[] = await Promise.all(
      files.map(async (file, i) => {
        const blob = await put(`posts/${author.id}/${randomUUID()}-${file.name}`, file, {
          access: "public",
          addRandomSuffix: false,
        });
        return {
          type: "image" as const,
          url: blob.url,
          posterUrl: null,
          width: widths[i] > 0 ? widths[i] : 1080,
          height: heights[i] > 0 ? heights[i] : 1350,
          blurDataUrl: null,
        };
      })
    );
    const post = await getFeedService().createPost(author, { caption, tags, location, media });
    return { ok: true, data: toPostDTO(post) };
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

export async function createStoryAction(formData: FormData): Promise<ActionResult<StoryDTO>> {
  const author = await requireAuthor();
  if (!author) return { ok: false, error: "Giriş gerekli.", code: "UNAUTHENTICATED" };

  const file = formData.get("media");
  if (!(file instanceof File)) return { ok: false, error: "Bir fotoğraf seç.", code: "INVALID_INPUT" };
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Yalnızca resim dosyaları desteklenir.", code: "INVALID_INPUT" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "Dosya çok büyük (en fazla 10MB).", code: "INVALID_INPUT" };
  }

  try {
    const blob = await put(`stories/${author.id}/${randomUUID()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    const story = await getFeedService().createStory(author, { mediaUrl: blob.url, type: "image" });
    return { ok: true, data: toStoryDTO(story) };
  } catch (e) {
    if (e instanceof FeedError) return { ok: false, error: e.message, code: e.code };
    return { ok: false, error: "Beklenmeyen bir hata oluştu." };
  }
}
