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
    // Generic storage addressing (no provider lock-in).
    storageProvider: storageProvider("storage_provider").notNull(),
    storageRef: text("storage_ref").notNull(),
    thumbnailRef: text("thumbnail_ref"),
    kind: mediaKind("kind").notNull(),
    // Stored media size in bytes — drives quota release on delete.
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    caption: text("caption"),
    // Distinguishes untouched AI caption from a deliberate user edit (incl. empty).
    captionSource: captionSource("caption_source").notNull().default("ai"),
    category: text("category"),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull(),
    location: text("location"),
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
export type User = typeof users.$inferSelect;
