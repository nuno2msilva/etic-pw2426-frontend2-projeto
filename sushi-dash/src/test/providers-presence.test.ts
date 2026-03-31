import { resolveHomeHeaderMode, resolvePresenceTableId } from "../../app/providers";

describe("LiveUpdates presence table selection", () => {
  it("returns null when staff session exists, even with a customer table id", () => {
    expect(resolvePresenceTableId("1", true)).toBeNull();
  });

  it("returns customer table id when there is no staff session", () => {
    expect(resolvePresenceTableId("2", false)).toBe("2");
  });

  it("returns null when no customer table id exists", () => {
    expect(resolvePresenceTableId(null, false)).toBeNull();
  });
});

describe("Home route header mode", () => {
  it("uses app header when a staff session exists", () => {
    expect(resolveHomeHeaderMode(null, true)).toBe("app");
  });

  it("uses app header when a customer table session exists", () => {
    expect(resolveHomeHeaderMode("12", false)).toBe("app");
  });

  it("uses light header only when there is no active session", () => {
    expect(resolveHomeHeaderMode(null, false)).toBe("light");
  });
});
