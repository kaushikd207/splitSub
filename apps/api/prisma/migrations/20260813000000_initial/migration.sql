-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'GROUP_OWNER', 'ADMIN');
CREATE TYPE "GroupStatus" AS ENUM ('DRAFT', 'OPEN', 'FULL', 'PAUSED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "MembershipStatus" AS ENUM ('RESERVED', 'PAYMENT_PENDING', 'ACTIVE', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'DISPUTED');
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FIXED', 'HYBRID');

CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "phone" TEXT, "avatar" TEXT, "passwordHash" TEXT NOT NULL, "emailVerified" BOOLEAN NOT NULL DEFAULT false, "role" "Role" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "SubscriptionService" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL UNIQUE, "slug" TEXT NOT NULL UNIQUE, "logoUrl" TEXT, "sharingAllowed" BOOLEAN NOT NULL DEFAULT false, "eligibilityRules" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "SubscriptionPlan" ("id" TEXT PRIMARY KEY, "serviceId" TEXT NOT NULL, "name" TEXT NOT NULL, "price" DECIMAL(10,2) NOT NULL, "billingCycle" TEXT NOT NULL, "maxMembers" INTEGER NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE "SubscriptionGroup" ("id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "serviceId" TEXT NOT NULL, "planId" TEXT NOT NULL, "totalPrice" DECIMAL(10,2) NOT NULL, "billingCycle" TEXT NOT NULL, "totalMembers" INTEGER NOT NULL, "offeredSlots" INTEGER NOT NULL, "renewalDate" TIMESTAMP(3) NOT NULL, "status" "GroupStatus" NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Membership" ("id" TEXT PRIMARY KEY, "groupId" TEXT NOT NULL, "userId" TEXT NOT NULL, "status" "MembershipStatus" NOT NULL DEFAULT 'RESERVED', "baseShare" DECIMAL(10,2) NOT NULL, "platformFee" DECIMAL(10,2) NOT NULL, "total" DECIMAL(10,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, UNIQUE("groupId", "userId"));
CREATE TABLE "SlotReservation" ("id" TEXT PRIMARY KEY, "groupId" TEXT NOT NULL, "userId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("groupId", "userId"));
CREATE TABLE "Payment" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "groupId" TEXT NOT NULL, "membershipId" TEXT NOT NULL, "amount" DECIMAL(10,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'INR', "platformFee" DECIMAL(10,2) NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED', "provider" TEXT NOT NULL, "providerOrderId" TEXT NOT NULL UNIQUE, "providerPaymentId" TEXT UNIQUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "PlatformFeeConfig" ("id" TEXT PRIMARY KEY, "type" "FeeType" NOT NULL, "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0, "fixed" DECIMAL(10,2) NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Notification" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Report" ("id" TEXT PRIMARY KEY, "reporterId" TEXT NOT NULL, "groupId" TEXT, "reason" TEXT NOT NULL, "details" TEXT, "status" TEXT NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Payout" ("id" TEXT PRIMARY KEY, "groupId" TEXT NOT NULL, "amount" DECIMAL(10,2) NOT NULL, "status" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Transaction" ("id" TEXT PRIMARY KEY, "paymentId" TEXT NOT NULL UNIQUE, "type" TEXT NOT NULL, "amount" DECIMAL(10,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Review" ("id" TEXT PRIMARY KEY, "authorId" TEXT NOT NULL, "groupId" TEXT NOT NULL, "rating" INTEGER NOT NULL, "comment" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("authorId", "groupId"));
CREATE TABLE "AuditLog" ("id" TEXT PRIMARY KEY, "actorId" TEXT, "action" TEXT NOT NULL, "entity" TEXT NOT NULL, "entityId" TEXT NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "SubscriptionPlan_serviceId_enabled_idx" ON "SubscriptionPlan"("serviceId", "enabled");
CREATE INDEX "SubscriptionGroup_status_serviceId_idx" ON "SubscriptionGroup"("status", "serviceId");
CREATE INDEX "SubscriptionGroup_ownerId_idx" ON "SubscriptionGroup"("ownerId");
CREATE INDEX "Membership_groupId_status_idx" ON "Membership"("groupId", "status");
CREATE INDEX "SlotReservation_groupId_expiresAt_idx" ON "SlotReservation"("groupId", "expiresAt");
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

ALTER TABLE "SubscriptionPlan" ADD FOREIGN KEY ("serviceId") REFERENCES "SubscriptionService"("id") ON DELETE CASCADE;
ALTER TABLE "SubscriptionGroup" ADD FOREIGN KEY ("ownerId") REFERENCES "User"("id");
ALTER TABLE "SubscriptionGroup" ADD FOREIGN KEY ("serviceId") REFERENCES "SubscriptionService"("id");
ALTER TABLE "SubscriptionGroup" ADD FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id");
ALTER TABLE "Membership" ADD FOREIGN KEY ("groupId") REFERENCES "SubscriptionGroup"("id") ON DELETE CASCADE;
ALTER TABLE "Membership" ADD FOREIGN KEY ("userId") REFERENCES "User"("id");
ALTER TABLE "SlotReservation" ADD FOREIGN KEY ("groupId") REFERENCES "SubscriptionGroup"("id") ON DELETE CASCADE;
ALTER TABLE "Payment" ADD FOREIGN KEY ("userId") REFERENCES "User"("id");
ALTER TABLE "Payment" ADD FOREIGN KEY ("groupId") REFERENCES "SubscriptionGroup"("id");
ALTER TABLE "Payment" ADD FOREIGN KEY ("membershipId") REFERENCES "Membership"("id");
ALTER TABLE "Notification" ADD FOREIGN KEY ("userId") REFERENCES "User"("id");
ALTER TABLE "Report" ADD FOREIGN KEY ("reporterId") REFERENCES "User"("id");
