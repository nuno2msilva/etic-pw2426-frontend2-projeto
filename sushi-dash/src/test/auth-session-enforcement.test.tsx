import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { saveAuthSession, getAuthSession, type AuthSession } from "@/lib/auth";

function AuthStateProbe() {
  const { staffSession } = useAuth();
  return <div>{staffSession ? `staff:${staffSession.role}` : "staff:none"}</div>;
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("Auth session enforcement", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("keeps staff logged in when session endpoint confirms active staff session", async () => {
    const staff: AuthSession = {
      role: "manager",
      permission: "manager",
      userId: 10,
      authenticatedAt: Date.now(),
    };
    saveAuthSession(staff);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        sessions: [{ role: "manager", authenticated: true }],
      }),
    } as Response);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("staff:manager")).toBeInTheDocument();
    });

    expect(getAuthSession("staff")?.role).toBe("manager");
  });

  it("logs staff out when session endpoint no longer reports active staff session (e.g. after password reset)", async () => {
    const staff: AuthSession = {
      role: "kitchen",
      permission: "kitchen",
      userId: 11,
      authenticatedAt: Date.now(),
    };
    saveAuthSession(staff);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        sessions: [{ role: "customer", authenticated: true }],
      }),
    } as Response);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("staff:none")).toBeInTheDocument();
    });

    expect(getAuthSession("staff")).toBeNull();
  });
});
