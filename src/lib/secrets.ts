import "server-only";

import { createDecipheriv, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Secrets encrypted at rest, in the spirit of Jasypt's `ENC(...)`.
 *
 * A value may be supplied either in the clear:
 *
 *     MS_CLIENT_SECRET=abc123
 *
 * or as ciphertext, decrypted at runtime with CONFIG_MASTER_KEY:
 *
 *     MS_CLIENT_SECRET_ENC=enc:v1:<base64>
 *
 * Generate the ciphertext with `npm run secret:encrypt`.
 *
 * WHAT THIS PROTECTS: the value sitting in a file — committed config, a shared
 * .env, a backup, a screen share.
 *
 * WHAT IT DOES NOT PROTECT: anything once the process is running. The master
 * key has to reach the process somehow, and whoever can read its environment or
 * memory can read the decrypted secret. It is only worth something if the key
 * and the ciphertext live in *different places* — key in the host's secret
 * store or systemd unit, ciphertext in the config file. Put both in
 * `.env.local` and you have gained nothing.
 */

const PREFIX = "enc:v1:";
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
/**
 * scrypt cost — deliberately slow, but this runs once per cold start.
 * N=2^15 needs 128·N·r = 32 MB, which is exactly Node's default `maxmem`
 * ceiling, so the limit has to be raised explicitly or scryptSync throws.
 */
export const SCRYPT_PARAMS = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export class SecretError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecretError";
  }
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function decryptSecret(payload: string, masterKey: string): string {
  const raw = Buffer.from(payload.slice(PREFIX.length), "base64");
  if (raw.length <= SALT_LEN + IV_LEN + TAG_LEN) {
    throw new SecretError("Ciphertext is truncated or malformed.");
  }

  const salt = raw.subarray(0, SALT_LEN);
  const iv = raw.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const tag = raw.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + TAG_LEN);
  const body = raw.subarray(SALT_LEN + IV_LEN + TAG_LEN);

  const key = scryptSync(masterKey, salt, KEY_LEN, SCRYPT_PARAMS);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(body), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    // GCM authentication failed: wrong key, or the payload was tampered with.
    throw new SecretError(
      "Could not decrypt — CONFIG_MASTER_KEY is wrong, or the value was altered.",
    );
  }
}

/**
 * Reads `NAME`, falling back to the encrypted `NAME_ENC`.
 * Returns an empty string when neither is set, so callers keep their existing
 * "which variables are missing" reporting.
 */
export function readSecret(name: string): string {
  const plain = process.env[name]?.trim();
  if (plain) return plain;

  const encrypted = process.env[`${name}_ENC`]?.trim();
  if (!encrypted) return "";

  if (!isEncrypted(encrypted)) {
    throw new SecretError(
      `${name}_ENC must start with "${PREFIX}". Generate it with \`npm run secret:encrypt\`.`,
    );
  }

  const masterKey = process.env.CONFIG_MASTER_KEY?.trim();
  if (!masterKey) {
    throw new SecretError(
      `${name}_ENC is set but CONFIG_MASTER_KEY is not — nothing can decrypt it.`,
    );
  }

  return decryptSecret(encrypted, masterKey);
}

/** Constant-time compare, for anything that verifies a secret rather than uses it. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
