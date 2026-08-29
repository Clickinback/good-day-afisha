ALTER TABLE "RawEvent"
ADD COLUMN "parserVersion" TEXT,
ADD COLUMN "parserModel" TEXT,
ADD COLUMN "aiResponseId" TEXT,
ADD COLUMN "processingAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "processedAt" TIMESTAMP(3),
ADD COLUMN "inputTokens" INTEGER,
ADD COLUMN "outputTokens" INTEGER;
