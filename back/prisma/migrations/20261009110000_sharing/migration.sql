ALTER TABLE "Document" ADD COLUMN "manageHash" TEXT, ADD COLUMN "deleteAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Document_manageHash_key" ON "Document"("manageHash");
ALTER TABLE "Session" ADD COLUMN "tokenHash" TEXT, ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE TABLE "Report" ("id" TEXT PRIMARY KEY, "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
"reason" TEXT NOT NULL, "description" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"status" TEXT NOT NULL DEFAULT 'open', "decision" TEXT);
