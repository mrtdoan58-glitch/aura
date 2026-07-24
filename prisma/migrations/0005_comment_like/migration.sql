-- Aura 0005: yorum beğenileri. Post "Like" tablosuyla aynı desen.

CREATE TABLE "CommentLike" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "commentId" TEXT NOT NULL REFERENCES "Comment"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "CommentLike_userId_commentId_key" UNIQUE ("userId", "commentId")
);
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike" ("commentId");
