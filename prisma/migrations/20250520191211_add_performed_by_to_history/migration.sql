-- AlterTable
ALTER TABLE "LoanHistory" ADD COLUMN     "performedById" TEXT;

-- AlterTable
ALTER TABLE "ReservationHistory" ADD COLUMN     "performedById" TEXT;

-- CreateIndex
CREATE INDEX "LoanHistory_userId_idx" ON "LoanHistory"("userId");

-- CreateIndex
CREATE INDEX "LoanHistory_performedById_idx" ON "LoanHistory"("performedById");

-- CreateIndex
CREATE INDEX "ReservationHistory_userId_idx" ON "ReservationHistory"("userId");

-- CreateIndex
CREATE INDEX "ReservationHistory_performedById_idx" ON "ReservationHistory"("performedById");

-- AddForeignKey
ALTER TABLE "ReservationHistory" ADD CONSTRAINT "ReservationHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanHistory" ADD CONSTRAINT "LoanHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
