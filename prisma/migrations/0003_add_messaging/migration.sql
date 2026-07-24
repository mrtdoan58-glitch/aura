-- Aura 0003: birebir (1:1) doğrudan mesajlaşma.
-- 0001/0002 ile aynı el-yazımı kanonik DDL konvansiyonu.

CREATE TABLE "Conversation" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "lastMessageAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation" ("lastMessageAt");

CREATE TABLE "ConversationParticipant" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "lastReadAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant" ("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant" ("userId");

CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "Message_conversationId_createdAt_id_idx" ON "Message" ("conversationId", "createdAt", "id");
