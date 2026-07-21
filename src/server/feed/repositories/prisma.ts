/**
 * Prisma feed repository implementasyonları (üretim). In-memory ile aynı arayüzleri
 * ve cursor semantiğini (createdAt DESC, id DESC tie-break) uygular (LSP).
 * `prisma generate` gerektirir; typecheck kapsamı dışında (bkz. tsconfig.json).
 */
import { prisma } from "@/server/db/prisma";
import { decodeCursor, encodeCursor } from "@/server/feed/cursor";
import type {
  Post, Comment, Story, Author, CursorParams, CursorPage,
  PostRepository, LikeRepository, SaveRepository, CommentRepository, StoryRepository,
} from "@/server/feed/domain";
import type { Prisma, User } from "@/generated/prisma/client";

function toAuthor(user: User): Author {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl ?? "https://i.pravatar.cc/200?img=68",
    verified: user.role !== "USER",
  };
}

type PostWithRelations = Prisma.PostGetPayload<{ include: { author: true; media: true } }>;

function toPost(row: PostWithRelations): Post {
  return {
    id: row.id,
    author: toAuthor(row.author),
    media: [...row.media]
      .sort((a, b) => a.order - b.order)
      .map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        posterUrl: m.posterUrl,
        width: m.width,
        height: m.height,
        blurDataUrl: m.blurDataUrl,
        order: m.order,
      })),
    caption: row.caption,
    tags: row.tags,
    location: row.location,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt,
  };
}

/**
 * Cursor'dan sonrasını seçen composite OR koşulu (createdAt DESC, id DESC ile tutarlı).
 * Prisma'nın model-özel (branded) filtre tiplerine uysun diye çağıran sorgunun kendi
 * bağlamında (contextual typing) inşa edilir — paylaşılan bir `Prisma.XWhereInput`
 * tipine sabitlenmez (aksi halde ör. Post ve Comment filtreleri birbirine atanamaz).
 */
function cursorOr(cursor: string | null | undefined) {
  const decoded = decodeCursor(cursor);
  if (!decoded) return undefined;
  const createdAt = new Date(decoded.createdAt);
  return [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: decoded.id } }];
}

export class PrismaPostRepository implements PostRepository {
  async listFeed(params: CursorParams): Promise<CursorPage<Post>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const or = cursorOr(params.cursor);
    const rows = await prisma.post.findMany({
      where: { deletedAt: null, ...(or ? { OR: or } : {}) },
      include: { author: true, media: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: page.map(toPost),
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  async findById(id: string): Promise<Post | null> {
    const row = await prisma.post.findUnique({ where: { id }, include: { author: true, media: true } });
    return row ? toPost(row) : null;
  }

  async incrementLikeCount(id: string, delta: number): Promise<void> {
    await prisma.post.update({ where: { id }, data: { likeCount: { increment: delta } } });
  }

  async incrementCommentCount(id: string, delta: number): Promise<void> {
    await prisma.post.update({ where: { id }, data: { commentCount: { increment: delta } } });
  }
}

export class PrismaLikeRepository implements LikeRepository {
  async exists(userId: string, postId: string): Promise<boolean> {
    const row = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
    return row !== null;
  }
  async add(userId: string, postId: string): Promise<boolean> {
    try {
      await prisma.like.create({ data: { userId, postId } });
      return true;
    } catch (e) {
      if (isUniqueConstraintError(e)) return false;
      throw e;
    }
  }
  async remove(userId: string, postId: string): Promise<boolean> {
    const res = await prisma.like.deleteMany({ where: { userId, postId } });
    return res.count > 0;
  }
  async filterLiked(userId: string, postIds: string[]): Promise<Set<string>> {
    const rows = await prisma.like.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    return new Set(rows.map((r) => r.postId));
  }
}

export class PrismaSaveRepository implements SaveRepository {
  async exists(userId: string, postId: string): Promise<boolean> {
    const row = await prisma.savedPost.findUnique({ where: { userId_postId: { userId, postId } } });
    return row !== null;
  }
  async add(userId: string, postId: string): Promise<boolean> {
    try {
      await prisma.savedPost.create({ data: { userId, postId } });
      return true;
    } catch (e) {
      if (isUniqueConstraintError(e)) return false;
      throw e;
    }
  }
  async remove(userId: string, postId: string): Promise<boolean> {
    const res = await prisma.savedPost.deleteMany({ where: { userId, postId } });
    return res.count > 0;
  }
  async filterSaved(userId: string, postIds: string[]): Promise<Set<string>> {
    const rows = await prisma.savedPost.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    return new Set(rows.map((r) => r.postId));
  }
  async listSaved(userId: string, params: CursorParams): Promise<CursorPage<Post>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const decoded = decodeCursor(params.cursor);
    const postWhere: Prisma.PostWhereInput | undefined = decoded
      ? {
          OR: [
            { createdAt: { lt: new Date(decoded.createdAt) } },
            { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
          ],
        }
      : undefined;
    const rows = await prisma.savedPost.findMany({
      where: { userId, post: { deletedAt: null, ...postWhere } },
      include: { post: { include: { author: true, media: true } } },
      orderBy: [{ post: { createdAt: "desc" } }, { post: { id: "desc" } }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const items = page.map((r) => toPost(r.post));
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
  }
}

export class PrismaCommentRepository implements CommentRepository {
  async listByPost(postId: string, params: CursorParams): Promise<CursorPage<Comment>> {
    const limit = Math.min(Math.max(params.limit, 1), 50);
    const or = cursorOr(params.cursor);
    const rows = await prisma.comment.findMany({
      where: { postId, deletedAt: null, ...(or ? { OR: or } : {}) },
      include: { author: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const items: Comment[] = page.map((c) => ({
      id: c.id,
      postId: c.postId,
      author: toAuthor(c.author),
      text: c.text,
      likeCount: c.likeCount,
      createdAt: c.createdAt,
    }));
    const last = items[items.length - 1];
    return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
  }

  async add(data: { postId: string; author: Author; text: string }): Promise<Comment> {
    const row = await prisma.comment.create({
      data: { postId: data.postId, authorId: data.author.id, text: data.text },
    });
    return {
      id: row.id,
      postId: row.postId,
      author: data.author,
      text: row.text,
      likeCount: row.likeCount,
      createdAt: row.createdAt,
    };
  }

  async countByPost(postId: string): Promise<number> {
    return prisma.comment.count({ where: { postId, deletedAt: null } });
  }
}

export class PrismaStoryRepository implements StoryRepository {
  async listActive(now: Date, viewerId: string | null): Promise<Story[]> {
    const rows = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      include: { author: true, views: viewerId ? { where: { viewerId } } : false },
      orderBy: { createdAt: "desc" },
    });
    const stories: Story[] = rows.map((s) => ({
      id: s.id,
      author: toAuthor(s.author),
      media: {
        id: s.id,
        type: s.type,
        url: s.mediaUrl,
        posterUrl: null,
        width: 1080,
        height: 1350,
        blurDataUrl: null,
        order: 0,
      },
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      seenByMe: viewerId ? s.views.length > 0 : false,
    }));
    return stories.sort(
      (a, b) => Number(a.seenByMe) - Number(b.seenByMe) || b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async markSeen(storyId: string, viewerId: string): Promise<void> {
    await prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      create: { storyId, viewerId },
      update: {},
    });
  }
}

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";
}
