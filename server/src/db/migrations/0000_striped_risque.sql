CREATE TYPE "public"."caption_source" AS ENUM('ai', 'user');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('local', 's3', 'gcs', 'drive');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'uploading', 'done', 'error');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"cover_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"path" text NOT NULL,
	"drive_file_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_entry_id" uuid NOT NULL,
	"storage_provider" "storage_provider" NOT NULL,
	"storage_ref" text NOT NULL,
	"thumbnail_ref" text,
	"kind" "media_kind" NOT NULL,
	"caption" text,
	"caption_source" "caption_source" DEFAULT 'ai' NOT NULL,
	"category" text,
	"taken_at" timestamp with time zone NOT NULL,
	"location" text,
	"duration_sec" double precision,
	"sync_status" "sync_status" DEFAULT 'done' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_albums" (
	"entry_id" uuid NOT NULL,
	"album_id" uuid NOT NULL,
	CONSTRAINT "entry_albums_entry_id_album_id_pk" PRIMARY KEY("entry_id","album_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"auto_sync" boolean DEFAULT true NOT NULL,
	"wifi_only" boolean DEFAULT false NOT NULL,
	"ai_caption" boolean DEFAULT true NOT NULL,
	"geo_tag" boolean DEFAULT false NOT NULL,
	"auto_categorize" boolean DEFAULT true NOT NULL,
	"caption_lang" text DEFAULT 'vi' NOT NULL,
	"caption_length" text DEFAULT 'medium' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"storage_quota_bytes" bigint DEFAULT 16106127360 NOT NULL,
	"storage_used_bytes" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_albums" ADD CONSTRAINT "entry_albums_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_albums" ADD CONSTRAINT "entry_albums_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drive_folders_user_path_uq" ON "drive_folders" USING btree ("user_id","path");--> statement-breakpoint
CREATE UNIQUE INDEX "entries_user_client_uq" ON "entries" USING btree ("user_id","client_entry_id");--> statement-breakpoint
CREATE INDEX "entries_user_taken_at_idx" ON "entries" USING btree ("user_id","taken_at" DESC NULLS LAST);