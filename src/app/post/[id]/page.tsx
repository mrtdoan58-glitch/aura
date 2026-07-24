import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { PostDetailHeader } from "@/components/feed/post-detail-header";
import { InlineComments } from "@/components/feed/inline-comments";
import { getFeedService } from "@/server/feed/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { PostView } from "@/server/feed/domain";
import type { PostDTO } from "@/lib/feed/types";

function toPostDTO(p: PostView): PostDTO {
  return { ...p, createdAt: p.createdAt.toISOString() };
}

/** Paylaşılan gönderi bağlantıları için zengin önizleme (Open Graph / Twitter). */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await getFeedService().getPost(id, null);
    const caption = post.caption.trim();
    const title = caption ? `${post.author.name}: ${caption.slice(0, 60)}` : `${post.author.name} paylaşımı`;
    const description = caption.slice(0, 160) || `${post.author.name} (@${post.author.username}) paylaşımı`;
    const image = post.media[0]?.url;
    return {
      title,
      description,
      openGraph: { title, description, type: "article", images: image ? [image] : [] },
      twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
    };
  } catch {
    return { title: "Gönderi" };
  }
}

/**
 * `instanceof FeedError` chunk sınırlarını aşamaz: FeedService "use server" action
 * chunk'ına da girdiği için servis örneği farklı bir FeedError sınıf kopyası fırlatır.
 * Bu yüzden sınıf kimliği yerine dayanıklı olan `code` alanını kontrol ederiz.
 */
function isNotFound(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "NOT_FOUND";
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();

  let post: PostView;
  try {
    post = await getFeedService().getPost(id, viewer?.id ?? null);
  } catch (e) {
    if (isNotFound(e)) notFound();
    throw e;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[500px]">
        <PostDetailHeader />
        <PostCard post={toPostDTO(post)} priority />
        <InlineComments postId={post.id} canComment={!!viewer} />
      </div>
    </AppShell>
  );
}
