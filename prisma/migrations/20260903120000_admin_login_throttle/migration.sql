CREATE TABLE "AdminLoginThrottle" (
    "clientHash" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminLoginThrottle_pkey" PRIMARY KEY ("clientHash")
);

CREATE INDEX "AdminLoginThrottle_updatedAt_idx" ON "AdminLoginThrottle"("updatedAt");
