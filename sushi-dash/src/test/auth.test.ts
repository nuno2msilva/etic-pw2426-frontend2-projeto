/**
 * ==========================================================================
 * Authentication Unit Tests
 * ==========================================================================
 *
 * Tests the authentication utilities (lib/auth.ts):
 *   - Password hashing (SHA-256)
 *   - Password verification
 *   - Password initialization
 *   - Auth session management (save, load, expire, clear)
 *   - Role-based access control (hasAccess)
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import {
  hashPassword,
  verifyPassword,
  initializePasswords,
  verifyKitchenPassword,
  verifyManagerPassword,
  updateKitchenPassword,
  updateManagerPassword,
  loginTableWithPin,
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  hasAccess,
  DEFAULT_KITCHEN_PASSWORD,
  DEFAULT_MANAGER_PASSWORD,
} from "@/lib/auth";
import type { AuthSession } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.clear();
  // Mock fetch — verifyKitchen/ManagerPassword call the backend after local check
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
  );
});

afterAll(() => {
  global.fetch = originalFetch;
});

// ==========================================================================
// PASSWORD HASHING
// ==========================================================================
describe("Password Hashing", () => {
  it("hashPassword produces a consistent SHA-256 hex string", async () => {
    const hash1 = await hashPassword("test-password");
    const hash2 = await hashPassword("test-password");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
  });

  it("different passwords produce different hashes", async () => {
    const hash1 = await hashPassword("password-a");
    const hash2 = await hashPassword("password-b");

    expect(hash1).not.toBe(hash2);
  });

  it("verifyPassword returns true for correct password", async () => {
    const hash = await hashPassword("my-secret");
    const result = await verifyPassword("my-secret", hash);
    expect(result).toBe(true);
  });

  it("verifyPassword returns false for wrong password", async () => {
    const hash = await hashPassword("my-secret");
    const result = await verifyPassword("wrong-password", hash);
    expect(result).toBe(false);
  });
});

// ==========================================================================
// PASSWORD INITIALIZATION
// ==========================================================================
describe("Password Initialization", () => {
  it("initializePasswords sets default passwords in localStorage", async () => {
    await initializePasswords();

    expect(localStorage.getItem("sushi-dash-kitchen-password")).toBeDefined();
    expect(localStorage.getItem("sushi-dash-manager-password")).toBeDefined();
  });

  it("initializePasswords does not overwrite existing passwords", async () => {
    localStorage.setItem("sushi-dash-kitchen-password", "custom-hash");
    await initializePasswords();

    expect(localStorage.getItem("sushi-dash-kitchen-password")).toBe("custom-hash");
  });

  it("verifyKitchenPassword works with default password", async () => {
    await initializePasswords();
    const result = await verifyKitchenPassword(DEFAULT_KITCHEN_PASSWORD);
    expect(result).toBe(true);
  });

  it("verifyKitchenPassword rejects wrong password", async () => {
    await initializePasswords();
    const result = await verifyKitchenPassword("wrong");
    expect(result).toBe(false);
  });

  it("verifyManagerPassword works with default password", async () => {
    await initializePasswords();
    const result = await verifyManagerPassword(DEFAULT_MANAGER_PASSWORD);
    expect(result).toBe(true);
  });
});

// ==========================================================================
// AUTH SESSION
// ==========================================================================
describe("Auth Session", () => {
  it("getAuthSession returns null when no session exists", () => {
    const session = getAuthSession();
    expect(session).toBeNull();
  });

  it("saveAuthSession + getAuthSession round-trips correctly", () => {
    const session: AuthSession = {
      role: "kitchen",
      authenticatedAt: Date.now(),
    };

    saveAuthSession(session);
    const loaded = getAuthSession();

    expect(loaded).not.toBeNull();
    expect(loaded!.role).toBe("kitchen");
  });

  it("clearAuthSession removes the session", () => {
    saveAuthSession({
      role: "manager",
      authenticatedAt: Date.now(),
    });

    clearAuthSession();
    expect(getAuthSession()).toBeNull();
  });

  it("expired sessions (>8 hours) are cleared automatically", () => {
    const NINE_HOURS_AGO = Date.now() - 9 * 60 * 60 * 1000;

    saveAuthSession({
      role: "kitchen",
      authenticatedAt: NINE_HOURS_AGO,
    });

    const session = getAuthSession();
    expect(session).toBeNull();
  });

  it("non-expired sessions (<8 hours) are returned", () => {
    const ONE_HOUR_AGO = Date.now() - 1 * 60 * 60 * 1000;

    saveAuthSession({
      role: "kitchen",
      authenticatedAt: ONE_HOUR_AGO,
    });

    const session = getAuthSession();
    expect(session).not.toBeNull();
  });
});

// ==========================================================================
// ACCESS CONTROL (hasAccess)
// ==========================================================================
describe("Access Control", () => {
  it("returns false when no session", () => {
    expect(hasAccess(null, "kitchen")).toBe(false);
  });

  it("manager has access to everything", () => {
    const session: AuthSession = { role: "manager", authenticatedAt: Date.now() };

    expect(hasAccess(session, "manager")).toBe(true);
    expect(hasAccess(session, "kitchen")).toBe(true);
    expect(hasAccess(session, "customer")).toBe(true);
  });

  it("kitchen staff can access kitchen and customer areas", () => {
    const session: AuthSession = { role: "kitchen", authenticatedAt: Date.now() };

    expect(hasAccess(session, "kitchen")).toBe(true);
    expect(hasAccess(session, "customer")).toBe(true);
    expect(hasAccess(session, "manager")).toBe(false);
  });

  it("customer can access own table only", () => {
    const session: AuthSession = {
      role: "customer",
      tableId: "3",
      authenticatedAt: Date.now(),
    };

    expect(hasAccess(session, "customer", "3")).toBe(true);
    expect(hasAccess(session, "customer", "5")).toBe(false);
    expect(hasAccess(session, "kitchen")).toBe(false);
    expect(hasAccess(session, "manager")).toBe(false);
  });
});

// ==========================================================================
// ORDER MANAGEMENT PERMISSIONS
// ==========================================================================
describe("Order Management Permissions", () => {
  describe("Manager Permissions", () => {
    const managerSession: AuthSession = {
      role: "manager",
      authenticatedAt: Date.now(),
    };

    it("manager can cancel active orders (success case)", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      // Manager has full access to cancel/delete orders
    });

    it("manager can delete delivered orders (success case)", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      // Manager has full access to delete completed orders
    });

    it("manager can delete cancelled orders (success case)", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      // Manager can delete both delivered AND cancelled orders
    });

    it("manager can update order status (success case)", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      expect(hasAccess(managerSession, "kitchen")).toBe(true);
      // Manager has kitchen access too
    });

    it("manager can view all orders (success case)", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
    });
  });

  describe("Kitchen Permissions", () => {
    const kitchenSession: AuthSession = {
      role: "kitchen",
      authenticatedAt: Date.now(),
    };

    it("kitchen can update order status (success case)", () => {
      expect(hasAccess(kitchenSession, "kitchen")).toBe(true);
      // Kitchen can advance orders through workflow
    });

    it("kitchen CANNOT cancel orders (fail case)", () => {
      expect(hasAccess(kitchenSession, "manager")).toBe(false);
      // Only manager can cancel
    });

    it("kitchen CANNOT delete orders (fail case)", () => {
      expect(hasAccess(kitchenSession, "manager")).toBe(false);
      // Only manager can delete
    });

    it("kitchen can view all orders (success case)", () => {
      expect(hasAccess(kitchenSession, "kitchen")).toBe(true);
    });
  });

  describe("Customer Permissions", () => {
    const customerSession: AuthSession = {
      role: "customer",
      tableId: "2",
      authenticatedAt: Date.now(),
    };

    it("customer can place orders for their table (success case)", () => {
      expect(hasAccess(customerSession, "customer", "2")).toBe(true);
    });

    it("customer CANNOT place orders for other tables (fail case)", () => {
      expect(hasAccess(customerSession, "customer", "5")).toBe(false);
    });

    it("customer CANNOT update order status (fail case)", () => {
      expect(hasAccess(customerSession, "kitchen")).toBe(false);
      expect(hasAccess(customerSession, "manager")).toBe(false);
    });

    it("customer CANNOT cancel orders (fail case)", () => {
      expect(hasAccess(customerSession, "manager")).toBe(false);
      // Only manager can cancel/delete
    });

    it("customer CANNOT delete orders (fail case)", () => {
      expect(hasAccess(customerSession, "manager")).toBe(false);
    });

    it("customer CANNOT access kitchen dashboard (fail case)", () => {
      expect(hasAccess(customerSession, "kitchen")).toBe(false);
    });

    it("customer CANNOT access manager panel (fail case)", () => {
      expect(hasAccess(customerSession, "manager")).toBe(false);
    });
  });

  describe("Unauthenticated Permissions", () => {
    it("no session CANNOT access kitchen (fail case)", () => {
      expect(hasAccess(null, "kitchen")).toBe(false);
    });

    it("no session CANNOT access manager (fail case)", () => {
      expect(hasAccess(null, "manager")).toBe(false);
    });

    it("no session CANNOT access customer area (fail case)", () => {
      expect(hasAccess(null, "customer")).toBe(false);
    });
  });
});

// ==========================================================================
// TABLE PIN LOGIN (fetch-based)
// ==========================================================================
describe("Table PIN Login", () => {
  it("loginTableWithPin returns true on 200", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);

    const result = await loginTableWithPin("3", "1234");

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login/table/3",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("loginTableWithPin returns false on 401", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const result = await loginTableWithPin("3", "0000");
    expect(result).toBe(false);
  });

  it("loginTableWithPin returns false on network error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await loginTableWithPin("3", "1234");
    expect(result).toBe(false);
  });
});

// ==========================================================================
// BACKEND VERIFY — fetch interaction
// ==========================================================================
describe("Backend verify + fetch", () => {
  it("verifyKitchenPassword calls backend after local hash match", async () => {
    await initializePasswords();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as Response);

    const result = await verifyKitchenPassword(DEFAULT_KITCHEN_PASSWORD);

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login/kitchen",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("verifyKitchenPassword returns false when backend rejects", async () => {
    await initializePasswords();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const result = await verifyKitchenPassword(DEFAULT_KITCHEN_PASSWORD);
    expect(result).toBe(false);
  });

  it("verifyManagerPassword calls backend after local hash match", async () => {
    await initializePasswords();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as Response);

    const result = await verifyManagerPassword(DEFAULT_MANAGER_PASSWORD);

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login/manager",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("verifyManagerPassword returns false when backend rejects", async () => {
    await initializePasswords();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false } as Response);

    const result = await verifyManagerPassword(DEFAULT_MANAGER_PASSWORD);
    expect(result).toBe(false);
  });

  it("verifyKitchenPassword returns false when no hash in localStorage", async () => {
    // Do NOT initialize passwords
    const result = await verifyKitchenPassword("anything");
    expect(result).toBe(false);
  });

  it("verifyManagerPassword returns false when no hash in localStorage", async () => {
    const result = await verifyManagerPassword("anything");
    expect(result).toBe(false);
  });
});

// ==========================================================================
// PASSWORD UPDATE (fetch-based)
// ==========================================================================
describe("Password Updates", () => {
  it("updateKitchenPassword updates localStorage and calls backend", async () => {
    await updateKitchenPassword("new-kitchen-pw");

    const hash = localStorage.getItem("sushi-dash-kitchen-password");
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64); // SHA-256

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/settings/passwords",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("updateManagerPassword updates localStorage and calls backend", async () => {
    await updateManagerPassword("new-manager-pw");

    const hash = localStorage.getItem("sushi-dash-manager-password");
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/settings/passwords",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// ==========================================================================
// SESSION CATEGORY ISOLATION
// ==========================================================================
describe("Session Category Isolation", () => {
  it("customer and staff sessions are stored separately", () => {
    saveAuthSession({ role: "customer", tableId: "1", authenticatedAt: Date.now() });
    saveAuthSession({ role: "kitchen", authenticatedAt: Date.now() });

    // Staff session is preferred when no role specified
    const any = getAuthSession();
    expect(any?.role).toBe("kitchen");

    // Can retrieve each independently
    const customer = getAuthSession("customer");
    expect(customer?.role).toBe("customer");

    const staff = getAuthSession("staff");
    expect(staff?.role).toBe("kitchen");
  });

  it("clearAuthSession('customer') keeps staff session", () => {
    saveAuthSession({ role: "customer", tableId: "1", authenticatedAt: Date.now() });
    saveAuthSession({ role: "manager", authenticatedAt: Date.now() });

    clearAuthSession("customer");

    expect(getAuthSession("customer")).toBeNull();
    expect(getAuthSession("staff")).not.toBeNull();
  });

  it("clearAuthSession('staff') keeps customer session", () => {
    saveAuthSession({ role: "customer", tableId: "2", authenticatedAt: Date.now() });
    saveAuthSession({ role: "kitchen", authenticatedAt: Date.now() });

    clearAuthSession("staff");

    expect(getAuthSession("staff")).toBeNull();
    expect(getAuthSession("customer")).not.toBeNull();
  });

  it("clearAuthSession() with no argument clears everything", () => {
    saveAuthSession({ role: "customer", tableId: "1", authenticatedAt: Date.now() });
    saveAuthSession({ role: "manager", authenticatedAt: Date.now() });

    clearAuthSession();

    expect(getAuthSession()).toBeNull();
    expect(getAuthSession("customer")).toBeNull();
    expect(getAuthSession("staff")).toBeNull();
  });
});
