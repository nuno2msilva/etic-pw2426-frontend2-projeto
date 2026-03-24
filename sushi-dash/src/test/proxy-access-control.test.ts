import { isPathAllowedForPermission } from "@/lib/route-permissions";

describe("proxy access control", () => {
  it("allows manager to access kitchen", () => {
    expect(isPathAllowedForPermission("/kitchen", "manager")).toBe(true);
  });

  it("denies admin from kitchen (admin-only policy for /admin)", () => {
    expect(isPathAllowedForPermission("/kitchen", "admin")).toBe(false);
  });

  it("allows kitchen to access kitchen", () => {
    expect(isPathAllowedForPermission("/kitchen", "kitchen")).toBe(true);
  });

  it("denies kitchen from manager", () => {
    expect(isPathAllowedForPermission("/manager", "kitchen")).toBe(false);
  });

  it("allows manager to access manager", () => {
    expect(isPathAllowedForPermission("/manager", "manager")).toBe(true);
  });

  it("denies manager from admin", () => {
    expect(isPathAllowedForPermission("/admin", "manager")).toBe(false);
  });
});
