ALTER TABLE "profiles" DROP CONSTRAINT "profiles_user_id_fkey";

DROP TABLE "user_roles";
DROP TABLE "role_permissions";
DROP TABLE "credentials";
DROP TABLE "sessions";
DROP TABLE "mfa_factors";
DROP TABLE "roles";
DROP TABLE "permissions";

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users"
  DROP COLUMN "phone_number",
  DROP COLUMN "preferred_contact_method",
  DROP COLUMN "status";

DROP TYPE "CredentialType";
DROP TYPE "MfaType";
DROP TYPE "ContactMethod";
DROP TYPE "UserStatus";
