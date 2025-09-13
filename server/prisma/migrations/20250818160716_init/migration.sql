-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DonorProfile" (
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "bloodType" TEXT NOT NULL,
    "lastDonationDate" DATE NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "addressLine" TEXT,
    "photoURL" TEXT,

    CONSTRAINT "DonorProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."RequesterProfile" (
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "addressLine" TEXT,

    CONSTRAINT "RequesterProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."Request" (
    "id" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "bloodType" TEXT NOT NULL,
    "unitsNeeded" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL,
    "caseDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "donorId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."DonorProfile" ADD CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RequesterProfile" ADD CONSTRAINT "RequesterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."RequesterProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "public"."DonorProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
