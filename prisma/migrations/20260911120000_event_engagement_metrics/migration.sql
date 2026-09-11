-- CreateEnum
CREATE TYPE "EngagementAction" AS ENUM ('VIEW', 'TICKET');

-- CreateTable
CREATE TABLE "EventEngagementMetric" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "action" "EngagementAction" NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEngagementMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventEngagementMetric_eventId_action_day_key" ON "EventEngagementMetric"("eventId", "action", "day");

-- CreateIndex
CREATE INDEX "EventEngagementMetric_day_idx" ON "EventEngagementMetric"("day");

-- CreateIndex
CREATE INDEX "EventEngagementMetric_eventId_day_idx" ON "EventEngagementMetric"("eventId", "day");

-- AddForeignKey
ALTER TABLE "EventEngagementMetric" ADD CONSTRAINT "EventEngagementMetric_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
