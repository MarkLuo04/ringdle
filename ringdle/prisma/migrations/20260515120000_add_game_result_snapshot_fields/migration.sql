-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN "guessedFighterIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "GameResult" ADD COLUMN "hintsRevealed" INTEGER NOT NULL DEFAULT 0;
