import { describe, expect, it } from "vitest";

import { matchReply } from "@/components/layout/SmartChat/SmartChat.config";

describe("matchReply", () => {
  it.each([
    ["บริษัทนี้ทำอะไร", { kind: "topic", key: "about" }],
    ["Tell me about your company", { kind: "topic", key: "about" }],
    ["มีบริการอะไรบ้าง", { kind: "topic", key: "services" }],
    ["Do you do API integration?", { kind: "topic", key: "services" }],
    ["ลูกค้าของคุณมีใครบ้าง", { kind: "topic", key: "clients" }],
    ["ขอเบอร์โทรหน่อย", { kind: "topic", key: "contact" }],
    ["What is your email?", { kind: "topic", key: "contact" }],
    ["อยากได้ใบเสนอราคา", { kind: "topic", key: "quote" }],
    ["Can I talk to a human?", { kind: "topic", key: "staff" }],
    ["เหมาะกับธุรกิจแบบไหน", { kind: "topic", key: "industries" }],
    ["FAQ", { kind: "topic", key: "faq" }],
    ["บริการ Cloud คืออะไร", { kind: "faq", key: "cloud" }],
    ["มีบริการด้าน Cybersecurity ไหม", { kind: "faq", key: "security" }],
    ["How long does a project take?", { kind: "faq", key: "timeline" }],
    ["รองรับหน่วยงานภาครัฐหรือไม่", { kind: "faq", key: "government" }],
  ] as const)("routes %j", (question, reply) => {
    expect(matchReply(question)).toEqual(reply);
  });

  it("prefers the specific question over the broad one", () => {
    // Pricing a service is a quote request, not a services question.
    expect(matchReply("ราคาบริการเท่าไหร่")).toEqual({
      kind: "topic",
      key: "quote",
    });
    // A government client question is the government FAQ.
    expect(matchReply("Which government clients do you have?")).toEqual({
      kind: "faq",
      key: "government",
    });
  });

  it("matches Latin keywords as whole words only", () => {
    // "ai" sits inside "said"; it is not about AI.
    expect(matchReply("I said hello")).toEqual({ kind: "fallback" });
    expect(matchReply("Can I use AI here?")).toEqual({
      kind: "topic",
      key: "services",
    });
  });

  it("ignores case", () => {
    expect(matchReply("ISO CERTIFIED?")).toEqual({
      kind: "topic",
      key: "about",
    });
  });

  it("falls back when nothing matches", () => {
    expect(matchReply("สวัสดี")).toEqual({ kind: "fallback" });
    expect(matchReply("hello there")).toEqual({ kind: "fallback" });
  });
});
