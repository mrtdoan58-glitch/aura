-- Aura 0002: gerçek olaylardan (takip/beğeni/yorum) üretilen bildirimler.
-- 0001_init ile aynı el-yazımı kanonik DDL konvansiyonu.

CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'LIKE', 'COMMENT');

CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "recipientId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "actorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "postId" TEXT,
  "postImageUrl" TEXT,
  "commentText" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification" ("recipientId", "createdAt");
