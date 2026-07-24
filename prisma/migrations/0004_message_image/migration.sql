-- Aura 0004: DM mesajlarına opsiyonel görsel. Eklemeli (nullable kolon), geriye dönük uyumlu.

ALTER TABLE "Message" ADD COLUMN "imageUrl" TEXT;
