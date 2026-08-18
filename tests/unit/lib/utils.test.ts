import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

/**
 * Every `components/ui/*` wrapper composes its defaults with the caller's
 * `className` through `cn`. If later utilities stopped winning, every override
 * in the codebase would silently stop applying — hence the conflict cases.
 */
describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "text-white")).toBe("px-2 text-white");
  });

  it("drops falsy values", () => {
    expect(cn("px-2", false, null, undefined, "", "text-white")).toBe(
      "px-2 text-white",
    );
  });

  it("accepts conditional objects and arrays", () => {
    expect(cn(["px-2", { "text-white": true, hidden: false }])).toBe(
      "px-2 text-white",
    );
  });

  it("lets the later Tailwind utility win over an earlier conflicting one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-white", "text-black")).toBe("text-black");
    expect(cn("bg-red-500 p-2", "bg-blue-500")).toBe("p-2 bg-blue-500");
  });

  it("keeps non-conflicting utilities from the same group", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });

  it("resolves conflicts across responsive variants independently", () => {
    // `sm:px-4` does not override the base `px-2` — different breakpoints.
    expect(cn("px-2", "sm:px-4")).toBe("px-2 sm:px-4");
    expect(cn("sm:px-2", "sm:px-4")).toBe("sm:px-4");
  });

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
