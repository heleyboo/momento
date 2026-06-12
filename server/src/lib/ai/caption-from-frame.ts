import { GoogleGenAI } from "@google/genai";
import {
  buildCaptionPrompt,
  sanitizeCaption,
  coerceCategory,
  type Category,
  type CaptionPromptOpts,
} from "./caption-prompt";

// Gemini Flash vision → { caption, category } from a single poster frame.
// One call yields both (cheap auto-categorize). Output is treated as untrusted:
// caption is length-capped + control-stripped, category coerced to the enum.

export interface CaptionResult {
  caption: string;
  category: Category;
}

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  client = new GoogleGenAI({ apiKey });
  return client;
}

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function captionFromFrame(
  poster: Buffer,
  opts: CaptionPromptOpts,
  mime = "image/jpeg",
): Promise<CaptionResult> {
  const res = await ai().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildCaptionPrompt(opts) },
          { inlineData: { mimeType: mime, data: poster.toString("base64") } },
        ],
      },
    ],
    config: { responseMimeType: "application/json", temperature: 0.4 },
  });

  const text = res.text ?? "";
  let parsed: { caption?: unknown; category?: unknown } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    // Model returned non-JSON despite the instruction — fall back gracefully.
    parsed = { caption: text };
  }

  return {
    caption: sanitizeCaption(typeof parsed.caption === "string" ? parsed.caption : ""),
    category: coerceCategory(parsed.category),
  };
}
