-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "performedById" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "performedById" TEXT;

-- CreateIndex
CREATE INDEX "Loan_performedById_idx" ON "Loan"("performedById");

-- CreateIndex
CREATE INDEX "Reservation_performedById_idx" ON "Reservation"("performedById");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
