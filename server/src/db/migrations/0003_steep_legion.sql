ALTER TABLE "users" ALTER COLUMN "google_sub" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;