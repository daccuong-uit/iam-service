-- CreateEnum for ContactMethod
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'PHONE');

-- AlterTable accounts: Add new columns and make email nullable
ALTER TABLE "accounts" 
  ADD COLUMN "phone_number" TEXT UNIQUE,
  ADD COLUMN "username" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN "display_name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "preferred_contact_method" "ContactMethod" NOT NULL DEFAULT 'EMAIL',
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add unique index on username
CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

-- Drop the old email-only unique constraint and make it nullable with unique index
DROP INDEX "accounts_email_key";
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email") WHERE "email" IS NOT NULL;

-- Create index on phone_number for faster lookups
CREATE INDEX "accounts_phone_number_idx" ON "accounts"("phone_number");
