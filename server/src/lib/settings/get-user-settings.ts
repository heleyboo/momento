import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

// Server-side read of caption preferences (never trust client-sent lang/length).
export interface UserSettings {
  aiCaption: boolean;
  autoCategorize: boolean;
  captionLang: string;
  captionLength: string;
}

const DEFAULTS: UserSettings = {
  aiCaption: true,
  autoCategorize: true,
  captionLang: "vi",
  captionLength: "medium",
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  if (!row) return DEFAULTS;
  return {
    aiCaption: row.aiCaption,
    autoCategorize: row.autoCategorize,
    captionLang: row.captionLang,
    captionLength: row.captionLength,
  };
}
