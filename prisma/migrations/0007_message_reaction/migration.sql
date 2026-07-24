-- Aura 0007: DM mesaj reaksiyonları (kullanıcı başına mesaj başına tek emoji).

CREATE TABLE "MessageReaction" (
  "id" TEXT PRIMARY KEY,
  "messageId" TEXT NOT NULL REFERENCES "Message"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "MessageReaction_messageId_userId_key" UNIQUE ("messageId", "userId")
);
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction" ("messageId");
