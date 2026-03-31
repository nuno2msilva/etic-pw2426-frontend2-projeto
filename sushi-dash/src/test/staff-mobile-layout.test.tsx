/** Staff layout responsiveness tests — verifies kitchen/manager/admin mobile-first class hooks remain present. */

import KitchenPage from "@/features/kitchen/components/KitchenPage";
import ManagerPage from "@/features/admin/components/ManagerPage";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import AdminPage from "../../app/admin/page";

describe("Do staff pages look good on a phone or just on a widescreen?", () => {
  it("kitchen page fills the screen height and doesn't scroll off into space", () => {
    const source = KitchenPage.toString();
    expect(source).toContain("page-shell");
    expect(source).toContain("page-shell-roomy");
    expect(source).toContain("text-2xl sm:text-3xl");
  });

  it("manager page stays contained — no overflow drama on small screens", () => {
    const source = ManagerPage.toString();
    expect(source).toContain("page-shell");
    expect(source).toContain("page-shell-tight");
    expect(source).toContain("w-full min-w-0");
  });

  it("admin route fits mobile viewport with a centered container", () => {
    const source = AdminPage.toString();
    expect(source).toContain("page-shell page-shell-tight");
    expect(source).toContain("container max-w-6xl");
  });

  it("admin panel shows cards on mobile and a table on desktop — best of both worlds", () => {
    const source = AdminPanel.toString();
    expect(source).toContain("space-y-3 sm:hidden");
    expect(source).toContain("hidden sm:block border rounded-lg overflow-hidden");
    expect(source).toContain("w-full sm:w-auto");
  });
});
