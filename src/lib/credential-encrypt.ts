import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getMasterKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be set and at least 32 characters");
  }
  return crypto.scryptSync(key.slice(0, 64), "compd-salt", KEY_LEN);
}

export function encryptCredential(plaintext: string): string {
  const master = getMasterKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, master, iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, enc]);
  return combined.toString("base64");
}

export function decryptCredential(ciphertext: string): string {
  const master = getMasterKey();
  const combined = Buffer.from(ciphertext, "base64");
  if (combined.length < IV_LEN + TAG_LEN) {
    throw new Error("Invalid encrypted credential");
  }
  const iv = combined.subarray(0, IV_LEN);
  const tag = combined.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = combined.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, master, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}

/**
 * If CREDENTIAL_ENCRYPTION_KEY is not set, we store plaintext (dev only).
 * In production always set the key.
 */
export function encryptCredentialSafe(plaintext: string): string {
  try {
    return encryptCredential(plaintext);
  } catch {
    return plaintext;
  }
}

export function decryptCredentialSafe(ciphertext: string): string {
  if (!process.env.CREDENTIAL_ENCRYPTION_KEY) {
    return ciphertext;
  }
  try {
    return decryptCredential(ciphertext);
  } catch {
    return ciphertext;
  }
}
