import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  doublePrecision,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// --- Enums -------------------------------------------------------------------
export const mediaKind = pgEnum("media_kind", ["photo", "video"]);
export const syncStatus = pgEnum("sync_status", ["pending", "uploading", "done", "error"]);
export const storageProvider = pgEnum("storage_provider", ["local", "s3", "gcs", "drive"]);
export const captionSource = pgEnum("caption_source", ["ai", "user"]);

// --- Users -------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: Google users have a google_sub; email/password users have a
  // password_hash. At least one identity is present.
  googleSub: text("google_sub").unique(),
  passwordHash: text("password_hash"),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  // Per-user storage quota guard against volume-fill DoS (bytes).
  storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" }).notNull().default(16106127360), // 15 GiB
  storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Entries -----------------------------------------------------------------
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Idempotency key = the iOS SwiftData local UUID; kills duplicate-entry replays.
    clientEntryId: uuid("client_entry_id").notNull(),
    // Post total size in bytes (sum of its media) — drives quota release on delete.
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    caption: text("caption"),
    // Distinguishes untouched AI caption from a deliberate user edit (incl. empty).
    captionSource: captionSource("caption_source").notNull().default("ai"),
    category: text("category"),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull(),
    location: text("location"),
    // Optional geotag coordinates (drives the memories map).
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    durationSec: doublePrecision("duration_sec"),
    syncStatus: syncStatus("sync_status").notNull().default("done"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Idempotency: one entry per (user, client UUID).
    uniqueIndex("entries_user_client_uq").on(t.userId, t.clientEntryId),
    // Timeline: newest-first per user.
    index("entries_user_taken_at_idx").on(t.userId, t.takenAt.desc()),
  ],
);

// --- Entry media -------------------------------------------------------------
// One post (entries row) has many media. A media row is created at stage time
// with entry_id NULL (idempotent on user+client_entry_id+media_client_id) and
// promoted by finalize (sets entry_id + position). user_id is denormalized so
// ownership for serve/delete never depends on the entries row (whose media
// columns are being retired).
export const entryMedia = pgTable(
  "entry_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Ties media to its post before the entry row exists (stage phase).
    clientEntryId: uuid("client_entry_id").notNull(),
    // Client-generated; idempotency key for staging a single media.
    mediaClientId: uuid("media_client_id").notNull(),
    // NULL until finalize promotes this media into a post.
    entryId: uuid("entry_id").references(() => entries.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    kind: mediaKind("kind").notNull(),
    storageProvider: storageProvider("storage_provider").notNull(),
    storageRef: text("storage_ref").notNull(),
    thumbnailRef: text("thumbnail_ref"),
    durationSec: doublePrecision("duration_sec"),
    // Not null so quota math (sum on delete) never yields NULL.
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Idempotent stage: one media per (user, post, client media id).
    uniqueIndex("entry_media_stage_uq").on(t.userId, t.clientEntryId, t.mediaClientId),
    // No duplicate position within a finalized post (NULL entry_id rows are
    // distinct under Postgres NULL semantics, so staged rows aren't constrained).
    uniqueIndex("entry_media_entry_position_uq").on(t.entryId, t.position),
    // Ownership-by-ref lookups for the media-serve + delete paths.
    index("entry_media_user_ref_idx").on(t.userId, t.storageRef),
    index("entry_media_entry_position_idx").on(t.entryId, t.position),
  ],
);

// --- Albums ------------------------------------------------------------------
export const albums = pgTable("albums", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  coverEntryId: uuid("cover_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entryAlbums = pgTable(
  "entry_albums",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.albumId] })],
);

// --- Settings ----------------------------------------------------------------
export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  autoSync: boolean("auto_sync").notNull().default(true),
  wifiOnly: boolean("wifi_only").notNull().default(false),
  aiCaption: boolean("ai_caption").notNull().default(true),
  geoTag: boolean("geo_tag").notNull().default(false),
  autoCategorize: boolean("auto_categorize").notNull().default(true),
  captionLang: text("caption_lang").notNull().default("vi"),
  captionLength: text("caption_length").notNull().default("medium"),
});

// --- Drive folders -----------------------------------------------------------
// Durable Drive folder-ID store: in-memory caches evaporate on restart and the
// `drive.file` scope can't reliably re-list app-created folders. One row per path.
export const driveFolders = pgTable(
  "drive_folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    driveFileId: text("drive_file_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("drive_folders_user_path_uq").on(t.userId, t.path)],
);

// --- Refresh tokens ----------------------------------------------------------
// Server-side session store enabling revocation. Access JWTs are short-lived;
// the refresh token row can be deleted to invalidate a session ("sign out").
// Only a hash of the token is stored — never the token itself.
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("refresh_tokens_user_idx").on(t.userId)],
);

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type EntryMedia = typeof entryMedia.$inferSelect;
export type NewEntryMedia = typeof entryMedia.$inferInsert;
export type User = typeof users.$inferSelect;
