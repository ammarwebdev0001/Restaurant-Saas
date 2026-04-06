-- CreateEnum
CREATE TYPE "EmployeeInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "EmployeeInvite" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "EmployeeInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployeeInvite_token_key" ON "EmployeeInvite"("token");

CREATE INDEX "EmployeeInvite_restaurantId_email_idx" ON "EmployeeInvite"("restaurantId", "email");

ALTER TABLE "EmployeeInvite" ADD CONSTRAINT "EmployeeInvite_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeInvite" ADD CONSTRAINT "EmployeeInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeInvite" ADD CONSTRAINT "EmployeeInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
