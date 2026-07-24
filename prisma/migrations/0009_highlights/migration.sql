-- Aura 0009: hikaye vurguları (highlights). Öğelerde medya URL'i kopyalanır ki
-- hikaye 24 saat sonra süresi dolsa/silinse de vurgu kalıcı kalsın; "storyId"
-- yalnızca aynı hikayenin aynı vurguya iki kez eklenmesini engellemek için tutulur.

CREATE TABLE "Highlight" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "Highlight_userId_createdAt_idx" ON "Highlight" ("userId", "createdAt");

CREATE TABLE "HighlightItem" (
  "id" TEXT PRIMARY KEY,
  "highlightId" TEXT NOT NULL REFERENCES "Highlight"("id") ON DELETE CASCADE,
  "storyId" TEXT,
  "mediaUrl" TEXT NOT NULL,
  "type" "MediaType" NOT NULL DEFAULT 'image',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "HighlightItem_highlightId_storyId_key" UNIQUE ("highlightId", "storyId")
);
CREATE INDEX "HighlightItem_highlightId_order_idx" ON "HighlightItem" ("highlightId", "order");
