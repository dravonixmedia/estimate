import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

describe("/estimate redirect", () => {
  it("permanently redirects to / preserving query and UTM parameters", () => {
    const request = new NextRequest("https://estimate.dravonix.dev/estimate?utm_source=website&utm_medium=footer");
    const response = GET(request);
    expect(response.status).toBe(308);
    const location = response.headers.get("location");
    expect(location).toBe("https://estimate.dravonix.dev/?utm_source=website&utm_medium=footer");
  });

  it("redirects to / with no trailing query string when none is present", () => {
    const request = new NextRequest("https://estimate.dravonix.dev/estimate");
    const response = GET(request);
    expect(response.headers.get("location")).toBe("https://estimate.dravonix.dev/");
  });
});
