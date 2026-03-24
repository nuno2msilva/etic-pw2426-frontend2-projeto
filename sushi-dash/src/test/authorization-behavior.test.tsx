import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AppHeader from "@/components/app/AppHeader";
import KitchenPage from "@/views/KitchenPage";
import ManagerPage from "@/views/ManagerPage";
import type { AuthSession } from "@/lib/auth";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockPathname = "/";

const mockUseAuth = jest.fn();
const mockUseApp = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/context/AppContext", () => ({
  useApp: () => mockUseApp(),
}));

function makeStaffSession(role: "kitchen" | "manager" | "admin"): AuthSession {
  return {
    role,
    permission: role,
    authenticatedAt: Date.now(),
    userId: 1,
    email: `${role}@sushi-dash.dev`,
  };
}

function makeManagerSessionWithoutPermission(): AuthSession {
  return {
    role: "manager",
    authenticatedAt: Date.now(),
    userId: 2,
    email: "manager-no-permission@sushi-dash.dev",
  };
}

function makeManagerSessionWithStaleAdminPermission(): AuthSession {
  return {
    role: "manager",
    permission: "admin",
    authenticatedAt: Date.now(),
    userId: 3,
    email: "manager-stale@sushi-dash.dev",
  };
}

function mockAuthState(staffSession: AuthSession | null) {
  mockUseAuth.mockReturnValue({
    customerSession: null,
    staffSession,
    session: staffSession,
    isInitialized: true,
    isAuthenticated: !!staffSession,
    loginAsCustomer: jest.fn(),
    loginAsStaffUser: jest.fn(),
    changePassword: jest.fn(),
    skipResetReminder: jest.fn(),
    remindMeLater: jest.fn(),
    passwordResetRequired: false,
    skipPasswordResetReminder: false,
    passwordChangeReminderDismissedThisSession: false,
    logout: jest.fn(),
    logoutStaff: jest.fn(),
    checkAccess: jest.fn(),
    authenticatedTableId: null,
  });
}

describe("Authorization behavior - route guards and shortcuts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/";

    mockUseApp.mockReturnValue({
      orders: [],
      updateOrderStatus: jest.fn(),
      cancelOrder: jest.fn(),
      deleteOrder: jest.fn(),
      menu: [],
      categories: [],
      categoryList: [],
      tables: [],
      settings: { maxItemsPerOrder: 10, maxActiveOrdersPerTable: 2 },
      addMenuItem: jest.fn(),
      removeMenuItem: jest.fn(),
      updateMenuItem: jest.fn(),
      toggleItemAvailability: jest.fn(),
      addCategory: jest.fn(),
      deleteCategory: jest.fn(),
      addTable: jest.fn(),
      updateTable: jest.fn(),
      removeTable: jest.fn(),
      updateSettings: jest.fn(),
    });
  });

  it("manager sees kitchen and manager shortcuts, but not admin", () => {
    mockAuthState(makeStaffSession("manager"));

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Kitchen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manager" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("admin does not see kitchen or manager shortcuts", () => {
    mockAuthState(makeStaffSession("admin"));

    render(<AppHeader />);

    expect(screen.queryByRole("link", { name: "Kitchen" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Manager" })).toBeNull();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
  });

  it("admin manually opening /kitchen is redirected away", async () => {
    mockPathname = "/kitchen";
    mockAuthState(makeStaffSession("admin"));

    const { container } = render(<KitchenPage />);

    await waitFor(() => {
      expect(mockBack.mock.calls.length + mockReplace.mock.calls.length).toBeGreaterThan(0);
    });

    if (mockReplace.mock.calls.length > 0) {
      expect(mockReplace).toHaveBeenCalledWith("/");
    }

    expect(container.firstChild).toBeNull();
  });

  it("admin manually opening /manager is redirected away", async () => {
    mockPathname = "/manager";
    mockAuthState(makeStaffSession("admin"));

    const { container } = render(<ManagerPage />);

    await waitFor(() => {
      expect(mockBack.mock.calls.length + mockReplace.mock.calls.length).toBeGreaterThan(0);
    });

    if (mockReplace.mock.calls.length > 0) {
      expect(mockReplace).toHaveBeenCalledWith("/");
    }

    expect(container.firstChild).toBeNull();
  });

  it("manager manually opening /kitchen is allowed", () => {
    mockPathname = "/kitchen";
    mockAuthState(makeStaffSession("manager"));

    render(<KitchenPage />);

    expect(screen.getByText(/Kitchen Dashboard/i)).toBeInTheDocument();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("manager can access kitchen even when legacy session misses explicit permission", () => {
    mockPathname = "/kitchen";
    mockAuthState(makeManagerSessionWithoutPermission());

    render(<KitchenPage />);

    expect(screen.getByText(/Kitchen Dashboard/i)).toBeInTheDocument();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("header still shows kitchen shortcut for manager with missing permission", () => {
    mockAuthState(makeManagerSessionWithoutPermission());

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Kitchen" })).toBeInTheDocument();
  });

  it("manager role with stale admin permission metadata can still access kitchen", () => {
    mockPathname = "/kitchen";
    mockAuthState(makeManagerSessionWithStaleAdminPermission());

    render(<KitchenPage />);

    expect(screen.getByText(/Kitchen Dashboard/i)).toBeInTheDocument();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
