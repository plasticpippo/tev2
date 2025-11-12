-- CreateTable
CREATE TABLE "daily_closings" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "daily_closings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;