-- Aura ilk migration (Sprint 1 + 2). Prisma `migrate dev` eşdeğeri kanonik DDL.

CREATE TYPE "Role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "username" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "emailVerified" TIMESTAMP,
  "avatarUrl" TEXT,
  "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP,
  "twoFactorSecret" TEXT,
  "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_username_idx" ON "User" ("username");

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "refreshTokenHash" TEXT NOT NULL UNIQUE,
  "previousTokenHash" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "deviceLabel" TEXT,
  "rememberMe" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP NOT NULL,
  "lastUsedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "Session_userId_idx" ON "Session" ("userId");

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "consumedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "consumedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "LoginAttempt" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "ipAddress" TEXT,
  "success" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt" ("email", "createdAt");

CREATE TABLE "Post" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "caption" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "location" TEXT,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "commentCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "editedAt" TIMESTAMP,
  "deletedAt" TIMESTAMP
);
CREATE INDEX "Post_createdAt_id_idx" ON "Post" ("createdAt", "id");
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post" ("authorId", "createdAt");

CREATE TABLE "Media" (
  "id" TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "type" "MediaType" NOT NULL DEFAULT 'image',
  "url" TEXT NOT NULL,
  "posterUrl" TEXT,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "blurDataUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "Media_postId_idx" ON "Media" ("postId");

CREATE TABLE "Comment" (
  "id" TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "parentId" TEXT REFERENCES "Comment"("id"),
  "text" TEXT NOT NULL,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMP
);
CREATE INDEX "Comment_postId_createdAt_id_idx" ON "Comment" ("postId", "createdAt", "id");

CREATE TABLE "Like" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Like_userId_postId_key" UNIQUE ("userId", "postId")
);
CREATE INDEX "Like_postId_idx" ON "Like" ("postId");

CREATE TABLE "SavedPost" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "SavedPost_userId_postId_key" UNIQUE ("userId", "postId")
);
CREATE INDEX "SavedPost_userId_createdAt_idx" ON "SavedPost" ("userId", "createdAt");

CREATE TABLE "Story" (
  "id" TEXT PRIMARY KEY,
  "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "mediaUrl" TEXT NOT NULL,
  "type" "MediaType" NOT NULL DEFAULT 'image',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMP NOT NULL
);
CREATE INDEX "Story_expiresAt_idx" ON "Story" ("expiresAt");

CREATE TABLE "StoryView" (
  "id" TEXT PRIMARY KEY,
  "storyId" TEXT NOT NULL REFERENCES "Story"("id") ON DELETE CASCADE,
  "viewerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "seenAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "StoryView_storyId_viewerId_key" UNIQUE ("storyId", "viewerId")
);

CREATE TABLE "Follow" (
  "id" TEXT PRIMARY KEY,
  "followerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "followingId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "Follow_followerId_followingId_key" UNIQUE ("followerId", "followingId")
);
CREATE INDEX "Follow_followingId_idx" ON "Follow" ("followingId");
