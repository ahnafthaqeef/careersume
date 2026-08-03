// Unit tests for the BYOK key envelope: AES-256-GCM under an HKDF-SHA256 key,
// and the v2 marker that tells a readable ciphertext from a legacy one.

import { hkdfSync, createDecipheriv } from "node:crypto";

jest.mock("@/lib/supabase/admin", () => ({ adminClient: {} }));

// test-only, not a real secret
process.env.BYOK_ENCRYPTION_KEY = "0uHq7yTZ9c1mKpX3vN8sLwErTyUiOpAsDfGhJkLzXcVb";

import { encryptKey, decryptKey } from "@/lib/byok";

const PLAINTEXT = "not-a-real-provider-key-just-test-bytes";

describe("encryptKey / decryptKey", () => {
  it("round-trips a provider key", () => {
    expect(decryptKey(encryptKey(PLAINTEXT))).toBe(PLAINTEXT);
  });

  it("marks the ciphertext with the format version", () => {
    expect(encryptKey(PLAINTEXT).encrypted_key.startsWith("v2:")).toBe(true);
  });

  it("uses a fresh IV per call, so the same key encrypts differently each time", () => {
    const a = encryptKey(PLAINTEXT);
    const b = encryptKey(PLAINTEXT);

    expect(a.iv).not.toBe(b.iv);
    expect(a.encrypted_key).not.toBe(b.encrypted_key);
  });

  it("refuses a stored value with no version marker (the pre-HKDF format)", () => {
    const legacy = { ...encryptKey(PLAINTEXT) };
    legacy.encrypted_key = legacy.encrypted_key.slice("v2:".length);

    expect(() => decryptKey(legacy)).toThrow("unsupported ciphertext format");
  });

  it("refuses a tampered ciphertext rather than returning garbage", () => {
    const record = encryptKey(PLAINTEXT);
    const bytes = Buffer.from(record.encrypted_key.slice("v2:".length), "base64");
    bytes[0] ^= 0xff;

    expect(() => decryptKey({ ...record, encrypted_key: "v2:" + bytes.toString("base64") })).toThrow();
  });

  it("cannot read a key encrypted under a different BYOK_ENCRYPTION_KEY", () => {
    const record = encryptKey(PLAINTEXT);
    const original = process.env.BYOK_ENCRYPTION_KEY;
    process.env.BYOK_ENCRYPTION_KEY = "a-completely-different-but-equally-long-secret";

    expect(() => decryptKey(record)).toThrow();

    process.env.BYOK_ENCRYPTION_KEY = original;
  });

  it("demands a secret long enough to be worth deriving from", () => {
    const original = process.env.BYOK_ENCRYPTION_KEY;
    process.env.BYOK_ENCRYPTION_KEY = "tooshort";

    expect(() => encryptKey(PLAINTEXT)).toThrow("at least 16 chars");

    process.env.BYOK_ENCRYPTION_KEY = original;
  });
});

// Every one of the tests above would still pass if the digest, salt, or info
// string changed, because they encrypt and decrypt under the same derivation.
// In production that change is silent and unrecoverable: every key already in
// `user_api_keys` stops decrypting, and every user has to reconnect a provider.
// So pin the derivation itself.
describe("key derivation", () => {
  const SECRET = "a-high-entropy-secret-value";
  // HKDF-SHA256(ikm=SECRET, salt='careersume-byok-v1', info='aes-256-gcm', 32).
  // Cross-checked against workerd under nodejs_compat, which produced the same
  // bytes as Node, so this vector also pins Worker and Node staying in step.
  const EXPECTED = "2eae57dd9d9ad240d2a634d13261aab66731eedc22a2c2f798f76bbc7393852a";

  it("matches the known answer for a fixed secret", () => {
    const derived = Buffer.from(hkdfSync("sha256", SECRET, "careersume-byok-v1", "aes-256-gcm", 32));

    expect(derived.toString("hex")).toBe(EXPECTED);
  });

  it("is the key encryptKey actually encrypts under", () => {
    const original = process.env.BYOK_ENCRYPTION_KEY;
    process.env.BYOK_ENCRYPTION_KEY = SECRET;
    const record = encryptKey(PLAINTEXT);
    process.env.BYOK_ENCRYPTION_KEY = original;

    // Decrypt by hand under the known-answer key, never touching decryptKey.
    const decipher = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(EXPECTED, "hex"),
      Buffer.from(record.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(record.auth_tag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(record.encrypted_key.slice("v2:".length), "base64")),
      decipher.final(),
    ]).toString("utf8");

    expect(plaintext).toBe(PLAINTEXT);
  });
});
