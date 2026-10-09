ALTER TABLE "User" ADD COLUMN "deleting" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "PasswordResetToken" (
 "tokenHash" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
