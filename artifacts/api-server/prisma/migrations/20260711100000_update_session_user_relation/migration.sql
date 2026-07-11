-- DropForeignKey
ALTER TABLE "ExamSession" DROP CONSTRAINT "ExamSession_studentUserId_fkey";

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
