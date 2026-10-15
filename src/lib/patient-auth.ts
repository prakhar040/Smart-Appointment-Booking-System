import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { AppError } from "./errors";

function scrypt(password: string, salt: Buffer, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}
const COOKIE = "morrow_patient_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_BYTES = 64;

function secret() {
  const value = process.env.PATIENT_AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new AppError("INTERNAL_ERROR", "Patient sign-in is not configured.", 500);
  }
  return value;
}

export function assertPatientAuthConfigured() {
  secret();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, PASSWORD_BYTES);
  return `scrypt$16384$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, cost, saltHex, hashHex] = encoded.split("$");
  if (algorithm !== "scrypt" || cost !== "16384" || !saltHex || !hashHex || !/^[a-f\d]+$/i.test(saltHex + hashHex)) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createPatientSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function patientEmailFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: unknown; exp?: unknown };
    return typeof decoded.email === "string" && typeof decoded.exp === "number" && decoded.exp > Date.now() / 1000
      ? normalizeEmail(decoded.email)
      : null;
  } catch {
    return null;
  }
}

export function requirePatient(request: Request) {
  const email = patientEmailFromRequest(request);
  if (!email) throw new AppError("UNAUTHORIZED", "Please sign in to continue.", 401);
  return email;
}

export const patientCookie = {
  name: COOKIE,
  value: (email: string) => createPatientSession(email),
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  },
};
