// Validates a forwarded Google Drive access token before the backend uses it
// (Phase 7 drive adapter). A token from the request body is untrusted input —
// verify it belongs to our app, carries only drive.file, and matches the
// session user, to avoid a confused-deputy / SSRF-toward-Google primitive.

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export interface DriveTokenCheck {
  ok: boolean;
  reason?: string;
}

export async function verifyDriveToken(
  accessToken: string,
  expectedGoogleSub: string,
): Promise<DriveTokenCheck> {
  const clientId = process.env.GOOGLE_CLIENT_ID_IOS;
  if (!clientId) return { ok: false, reason: "client id not configured" };

  let info: Record<string, string>;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return { ok: false, reason: "tokeninfo rejected token" };
    info = (await res.json()) as Record<string, string>;
  } catch {
    return { ok: false, reason: "tokeninfo request failed" };
  }

  const aud = info.aud ?? info.azp;
  if (aud !== clientId) return { ok: false, reason: "audience mismatch" };
  if (info.sub !== expectedGoogleSub) return { ok: false, reason: "subject mismatch" };

  const scopes = (info.scope ?? "").split(/\s+/).filter(Boolean);
  if (!scopes.includes(DRIVE_FILE_SCOPE)) {
    return { ok: false, reason: "missing drive.file scope" };
  }
  // Least privilege: reject broader Drive scopes than drive.file.
  const hasBroaderDrive = scopes.some(
    (s) => s.startsWith("https://www.googleapis.com/auth/drive") && s !== DRIVE_FILE_SCOPE,
  );
  if (hasBroaderDrive) return { ok: false, reason: "token has broader drive scope" };

  return { ok: true };
}
