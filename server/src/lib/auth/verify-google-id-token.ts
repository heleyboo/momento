import { OAuth2Client } from "google-auth-library";

// Verifies a Google ID token from the iOS app against Google's certs and our
// audience. Returns the verified identity, or null on any failure.

export interface GoogleIdentity {
  googleSub: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

const client = new OAuth2Client();

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity | null> {
  const audience = process.env.GOOGLE_CLIENT_ID_IOS;
  if (!audience) throw new Error("GOOGLE_CLIENT_ID_IOS not configured");

  try {
    const ticket = await client.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return null;
    // Reject unverified emails (descriptive-only today, but safe if email is
    // ever used as a lookup key downstream).
    if (payload.email_verified === false) return null;
    return {
      googleSub: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    };
  } catch {
    return null;
  }
}
