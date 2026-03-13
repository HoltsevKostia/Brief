/*
  Warnings:

  - Added the required column `briefSectionId` to the `BriefQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BriefQuestion_briefConfigId_sortOrder_idx";

-- AlterTable
ALTER TABLE "BriefQuestion" ADD COLUMN     "briefSectionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "BriefSection" (
    "id" TEXT NOT NULL,
    "briefConfigId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BriefSection_briefConfigId_sortOrder_idx" ON "BriefSection"("briefConfigId", "sortOrder");

-- CreateIndex
CREATE INDEX "BriefQuestion_briefConfigId_idx" ON "BriefQuestion"("briefConfigId");

-- CreateIndex
CREATE INDEX "BriefQuestion_briefSectionId_sortOrder_idx" ON "BriefQuestion"("briefSectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "BriefSection" ADD CONSTRAINT "BriefSection_briefConfigId_fkey" FOREIGN KEY ("briefConfigId") REFERENCES "BriefConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefQuestion" ADD CONSTRAINT "BriefQuestion_briefSectionId_fkey" FOREIGN KEY ("briefSectionId") REFERENCES "BriefSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
