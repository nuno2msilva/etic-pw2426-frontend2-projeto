/**
 * ==========================================================================
 * Utility Functions Unit Tests
 * ==========================================================================
 *
 * Tests the utility functions (lib/utils.ts):
 *   - cn() — className merger using clsx + tailwind-merge
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("merges multiple class strings", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    const result = cn("base", isHidden && "hidden", "visible");
    expect(result).toBe("base visible");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("handles undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles array inputs", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });
});
