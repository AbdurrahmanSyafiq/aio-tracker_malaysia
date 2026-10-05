import { createHmac, createHash, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "aio_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

const getSecret = () => process.env.AUTH_SECRET || "";

const sign = (payload: string) =>
  createHmac("sha256", getSecret()).update(payload).digest("hex");

/** Compare two strings without leaking timing information. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

export function createSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${exp}.${sign(String(exp))}`;
}

export function verifySessionToken(token?: string | null): boolean {
  if (!token || !getSecret()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Math.floor(Date.now() / 1000);
}
