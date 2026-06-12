CREATE TABLE "entry_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_entry_id" uuid NOT NULL,
	"media_client_id" uuid NOT NULL,
	"entry_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"kind" "media_kind" NOT NULL,
	"storage_provider" "storage_provider" NOT NULL,
	"storage_ref" text NOT NULL,
	"thumbnail_ref" text,
	"duration_sec" double precision,
	"size_bytes" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entry_media_stage_uq" ON "entry_media" USING btree ("user_id","client_entry_id","media_client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_media_entry_position_uq" ON "entry_media" USING btree ("entry_id","position");--> statement-breakpoint
CREATE INDEX "entry_media_user_ref_idx" ON "entry_media" USING btree ("user_id","storage_ref");--> statement-breakpoint
CREATE INDEX "entry_media_entry_position_idx" ON "entry_media" USING btree ("entry_id","position");--> statement-breakpoint
INSERT INTO "entry_media" (user_id, client_entry_id, media_client_id, entry_id, position, kind, storage_provider, storage_ref, thumbnail_ref, duration_sec, size_bytes)
SELECT e.user_id, e.client_entry_id, gen_random_uuid(), e.id, 0, e.kind, e.storage_provider, e.storage_ref, e.thumbnail_ref, e.duration_sec, COALESCE(e.size_bytes, 0)
FROM entries e
WHERE NOT EXISTS (SELECT 1 FROM entry_media m WHERE m.entry_id = e.id);