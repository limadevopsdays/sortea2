-- CreateEnum
CREATE TYPE "AvatarType" AS ENUM ('emoji', 'photo');

-- CreateEnum
CREATE TYPE "RaffleMode" AS ENUM ('ruleta', 'cuys', 'slot', 'dardos', 'cartas', 'paracaidas', 'bracket', 'bola');

-- CreateTable
CREATE TABLE "participants" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30),
    "avatarType" "AvatarType" NOT NULL,
    "avatarValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_draws" (
    "id" UUID NOT NULL,
    "mode" "RaffleMode" NOT NULL,
    "winnerId" UUID NOT NULL,
    "winnerIndex" INTEGER NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raffle_draws_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participants_createdAt_idx" ON "participants"("createdAt");

-- CreateIndex
CREATE INDEX "raffle_draws_drawnAt_idx" ON "raffle_draws"("drawnAt");

-- AddForeignKey
ALTER TABLE "raffle_draws" ADD CONSTRAINT "raffle_draws_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
