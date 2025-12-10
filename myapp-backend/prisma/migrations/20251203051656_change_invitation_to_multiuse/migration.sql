/*
  Warnings:

  - You are about to drop the column `is_used` on the `Invitation` table. All the data in the column will be lost.
  - You are about to drop the column `used_by` on the `Invitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "is_used",
DROP COLUMN "used_by",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
