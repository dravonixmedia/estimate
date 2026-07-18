import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { analyzeProjectDescription } from "./analyze";

describe("analyzeProjectDescription (silent fallback)", () => {
  const originalKey = process.env.CLAUDE_API_KEY;

  beforeEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  afterEach(() => {
    if (originalKey) process.env.CLAUDE_API_KEY = originalKey;
  });

  it("returns ok:false without throwing when no API key is configured", async () => {
    const result = await analyzeProjectDescription("A website for my bakery business.");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not_configured");
    }
  });
});
