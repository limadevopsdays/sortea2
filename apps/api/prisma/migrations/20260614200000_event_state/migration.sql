-- CreateTable
CREATE TABLE "event_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "registrationLocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_state_pkey" PRIMARY KEY ("id")
);
