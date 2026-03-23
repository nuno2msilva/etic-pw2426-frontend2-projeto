import type { Metadata } from "next";
import { AdminPanel } from "@/components/app/AdminPanel";

export const metadata: Metadata = {
  title: "Admin Panel | Sushi Dash",
  description: "Manage staff users, permissions, and password resets.",
};

export default function AdminPage() {
  return (
    <main className="h-full overflow-y-auto bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <AdminPanel />
      </div>
    </main>
  );
}
