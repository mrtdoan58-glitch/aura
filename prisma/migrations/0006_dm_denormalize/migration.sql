-- Aura 0006: DM listesi N+1'ini önlemek için denormalizasyon. Eklemeli, geriye dönük uyumlu.
-- (Prod'da mevcut konuşma yok; backfill gerekmez.)

ALTER TABLE "Conversation" ADD COLUMN "lastMessageText" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "lastMessageSenderId" TEXT;
ALTER TABLE "ConversationParticipant" ADD COLUMN "unreadCount" INTEGER NOT NULL DEFAULT 0;
