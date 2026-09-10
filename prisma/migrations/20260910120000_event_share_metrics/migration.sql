-- CreateEnum
CREATE TYPE "ShareChannel" AS ENUM ('NATIVE', 'TELEGRAM', 'VK', 'COPY');

-- CreateTable
CREATE TABLE "EventShareMetric" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" "ShareChannel" NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventShareMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventShareMetric_eventId_channel_day_key" ON "EventShareMetric"("eventId", "channel", "day");

-- CreateIndex
CREATE INDEX "EventShareMetric_day_idx" ON "EventShareMetric"("day");

-- CreateIndex
CREATE INDEX "EventShareMetric_eventId_day_idx" ON "EventShareMetric"("eventId", "day");

-- AddForeignKey
ALTER TABLE "EventShareMetric" ADD CONSTRAINT "EventShareMetric_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
