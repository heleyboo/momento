ALTER TABLE "entries" ALTER COLUMN "storage_provider" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "storage_ref" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ALTER COLUMN "kind" DROP NOT NULL;