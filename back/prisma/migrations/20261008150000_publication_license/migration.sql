ALTER TABLE "Document" ADD COLUMN "license" TEXT NOT NULL DEFAULT 'unspecified',
ADD COLUMN "attribution" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Document" ADD CONSTRAINT "Document_license_check" CHECK ("license" IN ('unspecified', 'reserved', 'CC-BY-4.0', 'CC-BY-SA-4.0'));
