import { describe, it, expect } from "vitest";
import { mergeScope } from "./merge";

describe("mergeScope", () => {
  it("merges a confirmed AI inference into existing scope without wiping unrelated fields", () => {
    const base = { website: { contentReady: "yes" as const } };
    const patch = { website: { pageCount: "2-5" as const, features: ["contact_form" as const, "whatsapp_integration" as const] } };

    const result = mergeScope(base, patch);

    expect(result.website?.contentReady).toBe("yes");
    expect(result.website?.pageCount).toBe("2-5");
    expect(result.website?.features).toEqual(["contact_form", "whatsapp_integration"]);
  });

  it("leaves other service sections untouched", () => {
    const base = { logo: { logoLevel: "basic" as const } };
    const patch = { website: { pageCount: "1" as const } };

    const result = mergeScope(base, patch);

    expect(result.logo?.logoLevel).toBe("basic");
    expect(result.website?.pageCount).toBe("1");
  });
});
