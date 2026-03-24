import { resolvePresenceTableId } from "../../app/providers";

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
