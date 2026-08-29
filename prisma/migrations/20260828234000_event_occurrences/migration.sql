CREATE TABLE "EventOccurrence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "price" DECIMAL(10,2),
    "ticketUrl" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventOccurrence_eventId_startsAt_key" ON "EventOccurrence"("eventId", "startsAt");
CREATE INDEX "EventOccurrence_startsAt_idx" ON "EventOccurrence"("startsAt");
ALTER TABLE "EventOccurrence" ADD CONSTRAINT "EventOccurrence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "EventOccurrence" ("id","eventId","startsAt","endsAt","price","ticketUrl","externalId","createdAt","updatedAt")
SELECT 'occ_' || substr(md5("id" || "startsAt"::text),1,20),"id","startsAt","endsAt","priceMin","ticketUrl",NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "Event";
