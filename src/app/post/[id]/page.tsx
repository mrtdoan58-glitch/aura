import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { PostDetailHeader } from "@/components/feed/post-detail-header";
import { getFeedService } from "@/server/feed/container-actions";
import { getCurrentUser } from "@/server/auth/current-user";
import type { PostView } from "@/server/feed/domain";
import type { PostDTO } from "@/lib/feed/types";

function toPostDTO(p: PostView): PostDTO {
  return { ...p, createdAt: p.createdAt.toISOString() };
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
      </div>
    </AppShell>
  );
}
