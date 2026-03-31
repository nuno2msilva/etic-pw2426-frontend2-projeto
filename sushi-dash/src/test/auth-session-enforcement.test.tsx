import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/features/shared/context/AuthContext";
import { saveAuthSession, getAuthSession, type AuthSession } from "@/features/shared/lib/auth";

function AuthStateProbe() {
  const { staffSession, customerSession } = useAuth();
  return (
    <div>
      <div>{staffSession ? `staff:${staffSession.role}` : "staff:none"}</div>
      <div>{customerSession ? `customer:${customerSession.tableId}` : "customer:none"}</div>
    </div>
  );
}

function CustomerLeaveProbe() {
  const { customerSession, goToTableSelection } = useAuth();

  return (
    <div>
      <div>{customerSession ? `customer:${customerSession.tableId}` : "customer:none"}</div>
      <button type="button" onClick={goToTableSelection}>Leave table</button>
    </div>
  );
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
    sessionStorage.clear();
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
    expect(sessionStorage.getItem("sushi-dash-staff-session")).toContain('"role":"manager"');
  });

  it("persists staff session in sessionStorage across provider remounts (route-change simulation)", async () => {
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

    const first = renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText("staff:manager")).toBeInTheDocument();
    });
    first.unmount();

    const second = renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText("staff:manager")).toBeInTheDocument();
    });

    expect(sessionStorage.getItem("sushi-dash-staff-session")).toContain('"role":"manager"');
    second.unmount();
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

  it("syncs stale local staff role to the server session role", async () => {
    const staleStaff: AuthSession = {
      role: "admin",
      permission: "admin",
      userId: 2,
      email: "nmsilva164@gmail.com",
      username: "nuno",
      authenticatedAt: Date.now(),
    };
    saveAuthSession(staleStaff);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        role: "manager",
        userId: 2,
        email: "nmsilva164@gmail.com",
        username: "nuno",
        sessions: [{ role: "manager", authenticated: true }],
      }),
    } as Response);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("staff:manager")).toBeInTheDocument();
    });

    expect(getAuthSession("staff")?.role).toBe("manager");
    expect(getAuthSession("staff")?.permission).toBe("manager");
  });

  it("keeps customer logged in when session endpoint confirms active customer session", async () => {
    const customer: AuthSession = {
      role: "customer",
      tableId: "1",
      authenticatedAt: Date.now(),
    };
    saveAuthSession(customer);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        sessions: [{ role: "customer", tableId: 1, authenticated: true }],
      }),
    } as Response);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("customer:1")).toBeInTheDocument();
    });

    expect(getAuthSession("customer")?.tableId).toBe("1");
  });

  it("logs customer out when session endpoint no longer reports active customer session", async () => {
    const customer: AuthSession = {
      role: "customer",
      tableId: "1",
      authenticatedAt: Date.now(),
    };
    saveAuthSession(customer);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: false,
        sessions: [],
      }),
    } as Response);

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText("customer:none")).toBeInTheDocument();
    });

    expect(getAuthSession("customer")).toBeNull();
  });

  it("logs customer out when explicitly leaving table selection for accurate presence", async () => {
    const customer: AuthSession = {
      role: "customer",
      tableId: "7",
      authenticatedAt: Date.now(),
    };
    saveAuthSession(customer);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        sessions: [{ role: "customer", tableId: 7, authenticated: true }],
      }),
    } as Response);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomerLeaveProbe />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("customer:7")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Leave table" }));

    await waitFor(() => {
      expect(screen.getByText("customer:none")).toBeInTheDocument();
    });

    expect(getAuthSession("customer")).toBeNull();
    expect(sessionStorage.getItem("sushi-dash-customer-session")).toBeNull();
  });
});
