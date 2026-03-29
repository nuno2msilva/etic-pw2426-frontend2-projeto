import type { Metadata } from "next";
import { AdminPanel } from "@/components/app/AdminPanel";
import WithAppProvider from "@/components/app/WithAppProvider";

export const metadata: Metadata = {
  title: "Admin Panel | Sushi Dash",
  description: "Manage staff users, permissions, and password resets.",
};

export default function AdminPage() {
  return (
    <WithAppProvider>
      <main className="h-[100dvh] sm:h-full overflow-y-auto bg-background">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-6">
          <AdminPanel />
        </div>
      </main>
    </WithAppProvider>
  );
}
