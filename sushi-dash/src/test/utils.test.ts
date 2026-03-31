/** Utils tests — cn() className merger with clsx + tailwind-merge */

import { cn } from "@/features/shared/lib/utils";

describe("Can cn() merge Tailwind classes without losing its mind?", () => {
  it("smashes two class strings together like a pro", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("gracefully ignores falsy classes — no drama", () => {
    const isHidden = false;
    const result = cn("base", isHidden && "hidden", "visible");
    expect(result).toBe("base visible");
  });

  it("last Tailwind class wins the conflict (survival of the fittest)", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });

  it("doesn't choke on undefined or null — very zen", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("returns empty string when given nothing (existential crisis)", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles arrays because sometimes you need to group your classes", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });
});
