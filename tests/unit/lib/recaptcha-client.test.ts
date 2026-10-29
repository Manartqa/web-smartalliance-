import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Node environment, so `window` is stubbed per test. The site key is read when
 * the config module loads, hence the env stub before each fresh import (the
 * setup file resets the module registry).
 */
const load = async () => await import("@/lib/recaptcha/client");

/**
 * A grecaptcha stub. `ready` defers its callback, as the real one does — which
 * matters: a throw from a deferred callback escapes the promise around it,
 * where a synchronous call would have been caught by the executor.
 */
const grecaptchaWith = (execute: (...args: unknown[]) => Promise<string>) => ({
  ready: (callback: () => void) => {
    setTimeout(callback, 0);
  },
  execute: vi.fn(execute),
});

beforeEach(() => {
  vi.stubGlobal("window", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getRecaptchaToken", () => {
  it("resolves undefined when no site key is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "");
    const { getRecaptchaToken } = await load();

    await expect(getRecaptchaToken()).resolves.toBeUndefined();
  });

  describe("with a site key", () => {
    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "site-key");
    });

    it("returns the token for the contact action", async () => {
      const grecaptcha = grecaptchaWith(async () => "token-123");
      vi.stubGlobal("window", { grecaptcha });
      const { getRecaptchaToken } = await load();

      await expect(getRecaptchaToken()).resolves.toBe("token-123");
      expect(grecaptcha.execute).toHaveBeenCalledWith("site-key", {
        action: "contact",
      });
    });

    it("rejects when the script never loads", async () => {
      vi.useFakeTimers();
      const { getRecaptchaToken, RECAPTCHA_SCRIPT_WAIT_MS } = await load();

      const token = expect(getRecaptchaToken()).rejects.toThrow(/not loaded/);
      await vi.advanceTimersByTimeAsync(RECAPTCHA_SCRIPT_WAIT_MS);
      await token;
      vi.useRealTimers();
    });

    it("waits for a script that is still loading", async () => {
      vi.useFakeTimers();
      const { getRecaptchaToken } = await load();

      const token = getRecaptchaToken();
      await vi.advanceTimersByTimeAsync(500);
      (window as { grecaptcha?: unknown }).grecaptcha = grecaptchaWith(
        async () => "late-token",
      );
      await vi.advanceTimersByTimeAsync(200);

      await expect(token).resolves.toBe("late-token");
      vi.useRealTimers();
    });

    it("rejects, rather than hanging, when execute throws synchronously", async () => {
      // What the real script does with a key it does not recognise.
      vi.stubGlobal("window", {
        grecaptcha: grecaptchaWith(() => {
          throw new Error("Invalid site key or not loaded in api.js");
        }),
      });
      const { getRecaptchaToken } = await load();

      await expect(getRecaptchaToken()).rejects.toThrow(/Invalid site key/);
    });

    it("rejects when execute's promise rejects", async () => {
      vi.stubGlobal("window", {
        grecaptcha: grecaptchaWith(() => Promise.reject(new Error("network"))),
      });
      const { getRecaptchaToken } = await load();

      await expect(getRecaptchaToken()).rejects.toThrow("network");
    });
  });
});

describe("recaptchaScriptSrc", () => {
  it("is undefined without a site key, so no script is rendered", async () => {
    vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "");
    const { recaptchaScriptSrc } = await load();

    expect(recaptchaScriptSrc("th")).toBeUndefined();
  });

  it("asks for the v3 loader in the page's language", async () => {
    vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "site-key");
    const { recaptchaScriptSrc } = await load();

    expect(recaptchaScriptSrc("th")).toBe(
      "https://www.google.com/recaptcha/api.js?render=site-key&hl=th",
    );
  });
});
