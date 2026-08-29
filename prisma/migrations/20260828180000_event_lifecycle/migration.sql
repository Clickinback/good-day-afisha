ALTER TABLE "RawEvent" ADD COLUMN "lifecycleProcessedAt" TIMESTAMP(3);
CREATE INDEX "RawEvent_lifecycleProcessedAt_idx" ON "RawEvent"("lifecycleProcessedAt");
