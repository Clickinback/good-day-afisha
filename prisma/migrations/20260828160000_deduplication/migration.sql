CREATE TYPE "DuplicateStatus" AS ENUM ('PENDING', 'AUTO_MATCHED', 'CONFIRMED', 'DISMISSED');

CREATE TABLE "DuplicateCandidate" (
    "id" TEXT NOT NULL,
    "rawEventId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "score" DECIMAL(4,3) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "status" "DuplicateStatus" NOT NULL DEFAULT 'PENDING',
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DuplicateCandidate_rawEventId_eventId_key" ON "DuplicateCandidate"("rawEventId", "eventId");
CREATE INDEX "DuplicateCandidate_status_score_idx" ON "DuplicateCandidate"("status", "score");
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_rawEventId_fkey" FOREIGN KEY ("rawEventId") REFERENCES "RawEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
