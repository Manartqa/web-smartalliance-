import { createCipheriv, randomBytes, scryptSync } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SCRYPT_PARAMS,
  SecretError,
  decryptSecret,
  isEncrypted,
  readSecret,
  safeEqual,
} from "@/lib/secrets";

const PREFIX = "enc:v1:";
const MASTER = "a-master-key-at-least-16-chars";

/**
 * Mirrors `scripts/encrypt-secret.mjs`. Deliberately a re-implementation rather
 * than an import: it is the *format contract* between the script and the
 * runtime, so if the script's layout is ever changed without changing
 * `secrets.ts` (or vice versa), these tests are where it shows up.
 */
function encrypt(plaintext: string, masterKey: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(masterKey, salt, 32, SCRYPT_PARAMS);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return (
    PREFIX +
    Buffer.concat([salt, iv, cipher.getAuthTag(), body]).toString("base64")
  );
}

describe("isEncrypted", () => {
  it("recognises the enc:v1: prefix", () => {
    expect(isEncrypted("enc:v1:abcd")).toBe(true);
  });

  it.each(["plain-secret", "ENC:V1:abcd", "enc:v2:abcd", "", " enc:v1:abcd"])(
    "rejects %j",
    (value) => {
      expect(isEncrypted(value)).toBe(false);
    },
  );
});

describe("decryptSecret", () => {
  it("round-trips a value encrypted by the script's scheme", () => {
    const payload = encrypt("s3cr3t-value", MASTER);
    expect(decryptSecret(payload, MASTER)).toBe("s3cr3t-value");
  });

  it("round-trips UTF-8 beyond ASCII", () => {
    const secret = "รหัสลับ-🔐-ñ";
    expect(decryptSecret(encrypt(secret, MASTER), MASTER)).toBe(secret);
  });

  it("produces a different ciphertext each time (random salt and IV)", () => {
    // Equal ciphertexts would leak that two config values are the same.
    expect(encrypt("same", MASTER)).not.toBe(encrypt("same", MASTER));
  });

  it("rejects the wrong master key rather than returning garbage", () => {
    const payload = encrypt("s3cr3t-value", MASTER);

    expect(() => decryptSecret(payload, "the-wrong-master-key")).toThrow(
      SecretError,
    );
    expect(() => decryptSecret(payload, "the-wrong-master-key")).toThrow(
      /CONFIG_MASTER_KEY is wrong/,
    );
  });

  it("rejects a tampered ciphertext body (GCM authentication)", () => {
    const payload = encrypt("s3cr3t-value", MASTER);
    const raw = Buffer.from(payload.slice(PREFIX.length), "base64");
    raw[raw.length - 1] ^= 0xff; // flip the last byte of the body

    expect(() =>
      decryptSecret(PREFIX + raw.toString("base64"), MASTER),
    ).toThrow(SecretError);
  });

  it("rejects a tampered auth tag", () => {
    const payload = encrypt("s3cr3t-value", MASTER);
    const raw = Buffer.from(payload.slice(PREFIX.length), "base64");
    raw[16 + 12] ^= 0xff; // first byte of the tag

    expect(() =>
      decryptSecret(PREFIX + raw.toString("base64"), MASTER),
    ).toThrow(SecretError);
  });

  it("rejects a truncated payload before reaching the cipher", () => {
    // salt+iv+tag is 44 bytes; anything at or below that has no body.
    const short = PREFIX + Buffer.alloc(44).toString("base64");

    expect(() => decryptSecret(short, MASTER)).toThrow(SecretError);
    expect(() => decryptSecret(short, MASTER)).toThrow(/truncated or malformed/);
  });

  it("throws SecretError, not a raw crypto error, for unparseable base64", () => {
    expect(() => decryptSecret(`${PREFIX}!!!not-base64!!!`, MASTER)).toThrow(
      SecretError,
    );
  });
});

describe("readSecret", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the plaintext variable when it is set", () => {
    vi.stubEnv("MS_CLIENT_SECRET", "  plain-value  ");
    expect(readSecret("MS_CLIENT_SECRET")).toBe("plain-value");
  });

  it("prefers the plaintext variable over the encrypted one", () => {
    vi.stubEnv("MS_CLIENT_SECRET", "plain-wins");
    vi.stubEnv("MS_CLIENT_SECRET_ENC", encrypt("encrypted-loses", MASTER));
    vi.stubEnv("CONFIG_MASTER_KEY", MASTER);

    expect(readSecret("MS_CLIENT_SECRET")).toBe("plain-wins");
  });

  it("decrypts the _ENC variable when no plaintext is set", () => {
    vi.stubEnv("MS_CLIENT_SECRET_ENC", encrypt("from-ciphertext", MASTER));
    vi.stubEnv("CONFIG_MASTER_KEY", MASTER);

    expect(readSecret("MS_CLIENT_SECRET")).toBe("from-ciphertext");
  });

  it("treats a whitespace-only plaintext as unset and falls through to _ENC", () => {
    vi.stubEnv("MS_CLIENT_SECRET", "   ");
    vi.stubEnv("MS_CLIENT_SECRET_ENC", encrypt("from-ciphertext", MASTER));
    vi.stubEnv("CONFIG_MASTER_KEY", MASTER);

    expect(readSecret("MS_CLIENT_SECRET")).toBe("from-ciphertext");
  });

  it("returns an empty string when neither variable is set", () => {
    // Callers rely on this to build their own "which variables are missing"
    // list rather than catching.
    expect(readSecret("DEFINITELY_UNSET_VARIABLE")).toBe("");
  });

  it("names the variable when _ENC is missing the prefix", () => {
    vi.stubEnv("MS_CLIENT_SECRET_ENC", "just-a-plain-string");
    vi.stubEnv("CONFIG_MASTER_KEY", MASTER);

    expect(() => readSecret("MS_CLIENT_SECRET")).toThrow(SecretError);
    expect(() => readSecret("MS_CLIENT_SECRET")).toThrow(
      /MS_CLIENT_SECRET_ENC must start with "enc:v1:"/,
    );
  });

  it("explains the problem when _ENC is set but the master key is not", () => {
    vi.stubEnv("MS_CLIENT_SECRET_ENC", encrypt("value", MASTER));

    expect(() => readSecret("MS_CLIENT_SECRET")).toThrow(
      /CONFIG_MASTER_KEY is not/,
    );
  });

  it("treats a whitespace-only master key as unset", () => {
    vi.stubEnv("MS_CLIENT_SECRET_ENC", encrypt("value", MASTER));
    vi.stubEnv("CONFIG_MASTER_KEY", "   ");

    expect(() => readSecret("MS_CLIENT_SECRET")).toThrow(
      /CONFIG_MASTER_KEY is not/,
    );
  });
});

describe("safeEqual", () => {
  it("is true for identical strings", () => {
    expect(safeEqual("token-abc", "token-abc")).toBe(true);
  });

  it("is false for different strings of equal length", () => {
    expect(safeEqual("token-abc", "token-abd")).toBe(false);
  });

  it("is false for different lengths without throwing", () => {
    // `timingSafeEqual` throws on unequal buffer lengths — the length guard in
    // front of it is what keeps this a comparison rather than a crash.
    expect(safeEqual("short", "much-longer-value")).toBe(false);
    expect(safeEqual("", "x")).toBe(false);
  });

  it("is true for two empty strings", () => {
    expect(safeEqual("", "")).toBe(true);
  });

  it("compares bytes, not code units", () => {
    // "é" is two UTF-8 bytes; a length check on `.length` alone would call
    // these equal-length and hand unequal buffers to timingSafeEqual.
    expect(safeEqual("é", "ee")).toBe(false);
  });
});
