#!/usr/bin/env node
/**
 * Encrypt a config value for `*_ENC` env vars — the counterpart to
 * `src/lib/secrets.ts`. Same scheme as Jasypt's `ENC(...)`, spelled
 * `enc:v1:<base64>` here.
 *
 *   npm run secret:genkey                    # make a master key
 *   npm run secret:encrypt                   # prompts, nothing echoed
 *   echo -n "the-secret" | npm run secret:encrypt
 *
 * The value is never taken as a command-line argument: argv lands in shell
 * history and in the process list, where other users on the box can read it.
 *
 * Keep these parameters identical to src/lib/secrets.ts.
 */
import { randomBytes, scryptSync, createCipheriv } from "node:crypto";
import { createInterface } from "node:readline";

const PREFIX = "enc:v1:";
// N=2^15 needs 32 MB, exactly Node's default maxmem ceiling — raise it.
const SCRYPT_PARAMS = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function encrypt(plaintext, masterKey) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(masterKey, salt, 32, SCRYPT_PARAMS);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([salt, iv, cipher.getAuthTag(), body]).toString("base64");
}

/** Prompt without echoing, so the secret never appears on screen. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (char) => {
      // Repaint the prompt so keystrokes leave no trace.
      if (![`\n`, `\r`, ``].includes(char.toString())) {
        process.stdout.write(`\r\x1b[2K${question}`);
      }
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => {
      process.stdin.off("data", onData);
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function readPipedStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")));
  });
}

const die = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

if (process.argv.includes("--genkey")) {
  console.log("\nAdd this to the host's secret store — NOT to .env.local:\n");
  console.log(`CONFIG_MASTER_KEY=${randomBytes(32).toString("base64")}\n`);
  process.exit(0);
}

const interactive = process.stdin.isTTY;

const secret = interactive
  ? await askHidden("Value to encrypt (hidden): ")
  : await readPipedStdin();

if (!secret) die("Nothing to encrypt.");

let masterKey = process.env.CONFIG_MASTER_KEY?.trim();
if (!masterKey) {
  if (!interactive) {
    die("CONFIG_MASTER_KEY is not set. Run `npm run secret:genkey` first.");
  }
  masterKey = await askHidden("CONFIG_MASTER_KEY (hidden): ");
}
if (!masterKey) die("A master key is required.");
if (masterKey.length < 16) die("Master key is too short — use at least 16 characters.");

console.log("\nPut this in .env.local (the master key stays elsewhere):\n");
console.log(`${encrypt(secret, masterKey)}\n`);
