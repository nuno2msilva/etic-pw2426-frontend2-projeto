import { resolveHomeHeaderMode, resolvePresenceTableId } from "../../app/providers";

describe("Does the presence system know who's a customer vs staff?", () => {
  it("ignores the customer table when staff is logged in — staff doesn't count as sitting", () => {
    expect(resolvePresenceTableId("1", true)).toBeNull();
  });

  it("tracks the customer's table when there's no staff session open", () => {
    expect(resolvePresenceTableId("2", false)).toBe("2");
  });

  it("gives up tracking when nobody has a table at all", () => {
    expect(resolvePresenceTableId(null, false)).toBeNull();
  });
});

describe("Does the home page header adapt to who's visiting?", () => {
  it("shows the full app header when staff is logged in", () => {
    expect(resolveHomeHeaderMode(null, true)).toBe("app");
  });

  it("shows the full app header when a customer has picked a table", () => {
    expect(resolveHomeHeaderMode("12", false)).toBe("app");
  });

  it("goes minimal when nobody is logged in — just the basics", () => {
    expect(resolveHomeHeaderMode(null, false)).toBe("light");
  });
});
