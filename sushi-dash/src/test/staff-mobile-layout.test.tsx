/** Staff layout responsiveness tests — verifies kitchen/manager/admin mobile-first class hooks remain present. */

import KitchenPage from "@/features/kitchen/components/KitchenPage";
import ManagerPage from "@/features/admin/components/ManagerPage";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import AdminPage from "../../app/admin/page";

describe("Staff mobile layout hardening", () => {
  it("kitchen page keeps dynamic viewport-height container and compact spacing", () => {
    const source = KitchenPage.toString();
    expect(source).toContain("page-shell");
    expect(source).toContain("page-shell-roomy");
    expect(source).toContain("text-2xl sm:text-3xl");
  });

  it("manager page keeps dynamic viewport-height container with overflow containment", () => {
    const source = ManagerPage.toString();
    expect(source).toContain("page-shell");
    expect(source).toContain("page-shell-tight");
    expect(source).toContain("w-full min-w-0");
  });

  it("admin route container uses dynamic viewport-height for mobile", () => {
    const source = AdminPage.toString();
    expect(source).toContain("page-shell page-shell-tight");
    expect(source).toContain("container max-w-6xl");
  });

  it("admin panel includes mobile cards and desktop table separation", () => {
    const source = AdminPanel.toString();
    expect(source).toContain("space-y-3 sm:hidden");
    expect(source).toContain("hidden sm:block border rounded-lg overflow-hidden");
    expect(source).toContain("w-full sm:w-auto");
  });
});
