-- Aura 0008: kaydedilenleri gruplayan isimli koleksiyonlar.
-- Eklemeli: mevcut kayıtlar collectionId=NULL ile "Tümü"de kalır.

CREATE TABLE "Collection" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Collection_userId_name_key" UNIQUE ("userId", "name")
);
CREATE INDEX "Collection_userId_createdAt_idx" ON "Collection" ("userId", "createdAt");

-- Koleksiyon silinirse kayıt silinmez, yalnızca gruplamadan çıkar.
ALTER TABLE "SavedPost" ADD COLUMN "collectionId" TEXT REFERENCES "Collection"("id") ON DELETE SET NULL;
CREATE INDEX "SavedPost_collectionId_idx" ON "SavedPost" ("collectionId");
