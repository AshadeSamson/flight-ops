/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Bay` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Bay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bay" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bay_code_key" ON "Bay"("code");
