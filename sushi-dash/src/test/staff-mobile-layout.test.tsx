/** Staff layout responsiveness tests — verifies kitchen/manager/admin mobile-first class hooks remain present. */

import KitchenPage from "@/views/KitchenPage";
import ManagerPage from "@/views/ManagerPage";
import { AdminPanel } from "@/components/app/AdminPanel";
import AdminPage from "../../app/admin/page";

describe("Staff mobile layout hardening", () => {
  it("kitchen page keeps dynamic viewport-height container and compact spacing", () => {
    const source = KitchenPage.toString();
    expect(source).toContain("h-[100dvh]");
    expect(source).toContain("px-3 sm:px-4");
    expect(source).toContain("text-2xl sm:text-3xl");
  });

  it("manager page keeps dynamic viewport-height container with overflow containment", () => {
    const source = ManagerPage.toString();
    expect(source).toContain("h-[calc(100dvh-4rem)]");
    expect(source).toContain("px-3 sm:px-4");
    expect(source).toContain("overflow-x-hidden");
  });

  it("admin route container uses dynamic viewport-height for mobile", () => {
    const source = AdminPage.toString();
    expect(source).toContain("h-[100dvh]");
    expect(source).toContain("px-3 sm:px-4");
  });

  it("admin panel includes mobile cards and desktop table separation", () => {
    const source = AdminPanel.toString();
    expect(source).toContain("space-y-3 sm:hidden");
    expect(source).toContain("hidden sm:block border rounded-lg overflow-hidden");
    expect(source).toContain("w-full sm:w-auto");
  });
});
