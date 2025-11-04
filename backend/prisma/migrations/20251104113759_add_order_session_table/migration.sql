-- CreateTable
CREATE TABLE "order_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoutTime" TIMESTAMP(3),

    CONSTRAINT "order_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_sessions" ADD CONSTRAINT "order_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
