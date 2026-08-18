import { describe, expect, it } from "vitest";

import { EMAIL_PATTERN } from "@/lib/validation";

/**
 * This pattern is the *only* email check on either side of the wire — the form
 * and the route handler both import it. Anything it accepts reaches nodemailer
 * as a `Reply-To`, so the cases that matter are the ones a header-injection or
 * a bounce would come from, not RFC 5322 completeness.
 */
describe("EMAIL_PATTERN", () => {
  it.each([
    "a@b.co",
    "first.last@example.com",
    "user+tag@sub.domain.co.th",
    "UPPER@EXAMPLE.COM",
    "dev@smartalliance.co.th",
    "user_name@example-host.org",
  ])("accepts %s", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["plainstring", "no @"],
    ["no-tld@example", "no dot in the domain"],
    ["@example.com", "no local part"],
    ["user@", "no domain"],
    ["user@.com", "domain starts with the dot"],
    ["user@example.", "nothing after the dot"],
    ["two@at@example.com", "two @ signs"],
    ["user name@example.com", "space in the local part"],
    ["user@exam ple.com", "space in the domain"],
  ])("rejects %s (%s)", (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(false);
  });

  /**
   * A newline in an address that reaches `Reply-To` is how a sender appends
   * their own SMTP headers. `\s` in the pattern already excludes it; this
   * pins that down so a future "more permissive" rewrite has to fail here
   * first.
   */
  it.each(["a@b.co\nBcc: victim@example.com", "a@b.co\r\nBcc: x@y.z", "a@b.co\r"])(
    "rejects the CRLF injection payload %j",
    (email) => {
      expect(EMAIL_PATTERN.test(email)).toBe(false);
    },
  );

  it("is not a global regex, so repeated tests do not alternate", () => {
    // A /g regex carries `lastIndex` between calls and would return
    // true,false,true… for the same input.
    expect(EMAIL_PATTERN.flags).not.toContain("g");
    expect(EMAIL_PATTERN.test("a@b.co")).toBe(true);
    expect(EMAIL_PATTERN.test("a@b.co")).toBe(true);
  });
});
