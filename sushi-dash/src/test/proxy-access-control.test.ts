import { isPathAllowedForPermission } from "@/features/shared/lib/route-permissions";

describe("Does the bouncer check badges at every door?", () => {
  it("can a manager waltz into the kitchen? yes they can", () => {
    expect(isPathAllowedForPermission("/kitchen", "manager")).toBe(true);
  });

  it("does admin get stopped at the kitchen door? absolutely", () => {
    expect(isPathAllowedForPermission("/kitchen", "admin")).toBe(false);
  });

  it("can kitchen staff access their own domain? obviously", () => {
    expect(isPathAllowedForPermission("/kitchen", "kitchen")).toBe(true);
  });

  it("what if kitchen staff tries to sneak into the manager panel?", () => {
    expect(isPathAllowedForPermission("/manager", "kitchen")).toBe(false);
  });

  it("can the manager access... the manager page? groundbreaking", () => {
    expect(isPathAllowedForPermission("/manager", "manager")).toBe(true);
  });

  it("what if a manager tries the admin panel? nope, rank matters", () => {
    expect(isPathAllowedForPermission("/admin", "manager")).toBe(false);
  });
});
