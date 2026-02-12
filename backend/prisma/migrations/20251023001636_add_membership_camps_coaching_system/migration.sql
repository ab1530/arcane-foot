/*
  Warnings:

  - The `status` column on the `camp_participations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `availableSpots` to the `camps` table without a default value. This is not possible if the table is not empty.
  - Made the column `capacity` on table `camps` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CampType" AS ENUM ('CAMP', 'DETECTION', 'SHOWCASE', 'TRAINING');

-- CreateEnum
CREATE TYPE "CampStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'REGISTERED', 'CONFIRMED', 'SELECTED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CoachingType" AS ENUM ('MENTAL_COACHING', 'PHYSICAL_TRAINING', 'NUTRITIONIST', 'PHYSIOTHERAPIST', 'TECHNICAL_COACH', 'TACTICAL_COACH', 'VIDEO_ANALYSIS', 'OTHER');

-- CreateEnum
CREATE TYPE "CoachingBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterEnum
ALTER TYPE "SubscriptionTier" ADD VALUE 'GOLD';

-- AlterTable
ALTER TABLE "camp_participations" ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "evaluatedAt" TIMESTAMP(3),
ADD COLUMN     "feedbackReport" TEXT,
ADD COLUMN     "hasPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medicalConditions" TEXT,
ADD COLUMN     "medicalWaiverSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medicalWaiverUrl" TEXT,
ADD COLUMN     "mentalRating" INTEGER,
ADD COLUMN     "paidAmount" DOUBLE PRECISION,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentName" TEXT,
ADD COLUMN     "parentPhone" TEXT,
ADD COLUMN     "parentalConsentGiven" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentalConsentUrl" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "performanceRating" INTEGER,
ADD COLUMN     "physicalRating" INTEGER,
ADD COLUMN     "scoutNotes" TEXT,
ADD COLUMN     "selectedForShowcase" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "technicalRating" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "ParticipationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "camps" ADD COLUMN     "address" TEXT,
ADD COLUMN     "availableSpots" INTEGER NOT NULL,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "hasShowcaseGame" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "includedBenefits" TEXT[],
ADD COLUMN     "partnerClubs" TEXT[],
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "programDetails" TEXT,
ADD COLUMN     "requiredTier" "SubscriptionTier",
ADD COLUMN     "requiresPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showcaseDate" TIMESTAMP(3),
ADD COLUMN     "status" "CampStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "type" "CampType" NOT NULL DEFAULT 'CAMP',
ALTER COLUMN "capacity" SET NOT NULL;

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "coachingType" "CoachingType" NOT NULL,
    "specialties" TEXT[],
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availability" JSONB,
    "city" TEXT,
    "country" TEXT,
    "canWorkRemote" BOOLEAN NOT NULL DEFAULT false,
    "languages" TEXT[],
    "certifications" TEXT[],
    "yearsExperience" INTEGER,
    "minTierRequired" "SubscriptionTier" NOT NULL DEFAULT 'BASIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "meetingLink" TEXT,
    "status" "CoachingBookingStatus" NOT NULL DEFAULT 'PENDING',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "userNotes" TEXT,
    "coachNotes" TEXT,
    "userRating" INTEGER,
    "userFeedback" TEXT,
    "coachFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "coaching_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_email_key" ON "coaches"("email");

-- CreateIndex
CREATE INDEX "coaches_coachingType_idx" ON "coaches"("coachingType");

-- CreateIndex
CREATE INDEX "coaches_isActive_idx" ON "coaches"("isActive");

-- CreateIndex
CREATE INDEX "coaches_city_idx" ON "coaches"("city");

-- CreateIndex
CREATE INDEX "coaching_bookings_userId_idx" ON "coaching_bookings"("userId");

-- CreateIndex
CREATE INDEX "coaching_bookings_coachId_idx" ON "coaching_bookings"("coachId");

-- CreateIndex
CREATE INDEX "coaching_bookings_sessionDate_idx" ON "coaching_bookings"("sessionDate");

-- CreateIndex
CREATE INDEX "coaching_bookings_status_idx" ON "coaching_bookings"("status");

-- CreateIndex
CREATE INDEX "camp_participations_status_idx" ON "camp_participations"("status");

-- CreateIndex
CREATE INDEX "camps_status_idx" ON "camps"("status");

-- CreateIndex
CREATE INDEX "camps_type_idx" ON "camps"("type");

-- AddForeignKey
ALTER TABLE "coaching_bookings" ADD CONSTRAINT "coaching_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_bookings" ADD CONSTRAINT "coaching_bookings_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
