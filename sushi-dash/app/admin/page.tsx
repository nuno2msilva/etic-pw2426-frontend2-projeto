import type { Metadata } from "next";
import { AdminPanel } from "@/features/admin/components/AdminPanel";
import WithAppProvider from "@/features/shared/components/WithAppProvider";

export const metadata: Metadata = {
  title: "Admin Panel | Sushi Dash",
  description: "Manage staff users, permissions, and password resets.",
};

export default function AdminPage() {
  return (
    <WithAppProvider>
      <main className="page-shell page-shell-tight bg-background">
        <div className="container max-w-6xl mx-auto px-0">
          <AdminPanel />
        </div>
      </main>
    </WithAppProvider>
  );
}
