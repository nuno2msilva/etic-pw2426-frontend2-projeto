// Can we keep secrets without losing our keys?

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
  hasStaffPermission,
  resolveStaffPermission,
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

describe("Does SHA-256 actually hash things properly?", () => {
  it("produces the same hash for the same input (consistency is key)", async () => {
    const hash1 = await hashPassword("test-password");
    const hash2 = await hashPassword("test-password");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
  });

  it("doesn't pretend two different passwords are the same", async () => {
    const hash1 = await hashPassword("password-a");
    const hash2 = await hashPassword("password-b");

    expect(hash1).not.toBe(hash2);
  });

  it("says 'yes' when the password is actually correct", async () => {
    const hash = await hashPassword("my-secret");
    const result = await verifyPassword("my-secret", hash);
    expect(result).toBe(true);
  });

  it("says 'nope' when the password is wrong", async () => {
    const hash = await hashPassword("my-secret");
    const result = await verifyPassword("wrong-password", hash);
    expect(result).toBe(false);
  });
});

describe("Can we set up default passwords without shooting ourselves in the foot?", () => {
  it("seeds kitchen and manager passwords into localStorage on first run", async () => {
    await initializePasswords();

    expect(localStorage.getItem("sushi-dash-kitchen-password")).toBeDefined();
    expect(localStorage.getItem("sushi-dash-manager-password")).toBeDefined();
  });

  it("respects existing passwords and doesn't bulldoze them", async () => {
    localStorage.setItem("sushi-dash-kitchen-password", "custom-hash");
    await initializePasswords();

    expect(localStorage.getItem("sushi-dash-kitchen-password")).toBe("custom-hash");
  });

  it("lets the default kitchen password in the front door", async () => {
    await initializePasswords();
    const result = await verifyKitchenPassword(DEFAULT_KITCHEN_PASSWORD);
    expect(result).toBe(true);
  });

  it("slams the door on wrong kitchen passwords", async () => {
    await initializePasswords();
    const result = await verifyKitchenPassword("wrong");
    expect(result).toBe(false);
  });

  it("lets the default manager password through too", async () => {
    await initializePasswords();
    const result = await verifyManagerPassword(DEFAULT_MANAGER_PASSWORD);
    expect(result).toBe(true);
  });
});

describe("Does session storage actually remember who you are?", () => {
  it("returns null when nobody has logged in (shocker)", () => {
    const session = getAuthSession();
    expect(session).toBeNull();
  });

  it("round-trips a session through save and load without data loss", () => {
    const session: AuthSession = {
      role: "kitchen",
      authenticatedAt: Date.now(),
    };

    saveAuthSession(session);
    const loaded = getAuthSession();

    expect(loaded).not.toBeNull();
    expect(loaded!.role).toBe("kitchen");
  });

  it("actually clears the session when told to forget", () => {
    saveAuthSession({
      role: "manager",
      authenticatedAt: Date.now(),
    });

    clearAuthSession();
    expect(getAuthSession()).toBeNull();
  });

  it("auto-expires sessions older than 8 hours (no squatting)", () => {
    const NINE_HOURS_AGO = Date.now() - 9 * 60 * 60 * 1000;

    saveAuthSession({
      role: "kitchen",
      authenticatedAt: NINE_HOURS_AGO,
    });

    const session = getAuthSession();
    expect(session).toBeNull();
  });

  it("keeps recent sessions alive and well", () => {
    const ONE_HOUR_AGO = Date.now() - 1 * 60 * 60 * 1000;

    saveAuthSession({
      role: "kitchen",
      authenticatedAt: ONE_HOUR_AGO,
    });

    const session = getAuthSession();
    expect(session).not.toBeNull();
  });
});

describe("Does the bouncer let the right people through?", () => {
  it("blocks everyone when there's no session at all", () => {
    expect(hasAccess(null, "kitchen")).toBe(false);
  });

  it("gives the manager keys to every room", () => {
    const session: AuthSession = { role: "manager", authenticatedAt: Date.now() };

    expect(hasAccess(session, "manager")).toBe(true);
    expect(hasAccess(session, "kitchen")).toBe(true);
    expect(hasAccess(session, "customer")).toBe(true);
  });

  it("lets kitchen staff into kitchen and customer areas but not the vault", () => {
    const session: AuthSession = { role: "kitchen", authenticatedAt: Date.now() };

    expect(hasAccess(session, "kitchen")).toBe(true);
    expect(hasAccess(session, "customer")).toBe(true);
    expect(hasAccess(session, "manager")).toBe(false);
  });

  it("locks customers to their own table like a well-behaved seatbelt", () => {
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

describe("Who gets to cancel, delete, and boss orders around?", () => {
  describe("The manager — overlord of all orders", () => {
    const managerSession: AuthSession = {
      role: "manager",
      authenticatedAt: Date.now(),
    };

    it("can cancel orders because they run this place", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      // Manager has full access to cancel/delete orders
    });

    it("can delete old orders like yesterday's news", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      // Manager has full access to delete completed orders
    });

    it("can delete cancelled orders too because why not", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      // Manager can delete both delivered AND cancelled orders
    });

    it("can also play kitchen staff when they feel like it", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
      expect(hasAccess(managerSession, "kitchen")).toBe(true);
      // Manager has kitchen access too
    });

    it("can see every order across all tables", () => {
      expect(hasAccess(managerSession, "manager")).toBe(true);
    });
  });

  describe("Admin role hard boundaries", () => {
    const adminSession: AuthSession = {
      role: "admin",
      permission: "admin",
      authenticatedAt: Date.now(),
    };

    it("admin can access admin-only features", () => {
      expect(hasAccess(adminSession, "admin")).toBe(true);
      expect(hasStaffPermission(adminSession, "admin")).toBe(true);
    });

    it("admin cannot access kitchen or manager areas", () => {
      expect(hasAccess(adminSession, "kitchen")).toBe(false);
      expect(hasAccess(adminSession, "manager")).toBe(false);
      expect(hasStaffPermission(adminSession, "kitchen")).toBe(false);
      expect(hasStaffPermission(adminSession, "manager")).toBe(false);
    });

    it("admin manual URL exploit is denied by permission helper", () => {
      expect(hasStaffPermission(adminSession, "kitchen")).toBe(false);
      expect(hasStaffPermission(adminSession, "manager")).toBe(false);
    });
  });

  describe("Kitchen staff — can cook but can't fire people", () => {
    const kitchenSession: AuthSession = {
      role: "kitchen",
      authenticatedAt: Date.now(),
    };

    it("can push orders through the workflow", () => {
      expect(hasAccess(kitchenSession, "kitchen")).toBe(true);
      // Kitchen can advance orders through workflow
    });

    it("can NOT cancel orders (nice try though)", () => {
      expect(hasAccess(kitchenSession, "manager")).toBe(false);
      // Only manager can cancel
    });

    it("can NOT delete orders either (not your job)", () => {
      expect(hasAccess(kitchenSession, "manager")).toBe(false);
      // Only manager can delete
    });

    it("can see the full order board", () => {
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

    it("customers dream of management but can't have it", () => {
      expect(hasAccess(customerSession, "manager")).toBe(false);
    });
  });

  describe("Randos off the street get nothing", () => {
    it("no session, no kitchen — go away", () => {
      expect(hasAccess(null, "kitchen")).toBe(false);
    });

    it("no session, no manager panel — nice try", () => {
      expect(hasAccess(null, "manager")).toBe(false);
    });

    it("no session, no customer area — not even that", () => {
      expect(hasAccess(null, "customer")).toBe(false);
    });
  });
});

describe("Can you get into a table with a PIN or are you locked out?", () => {
  it("correct PIN gets a thumbs up from the server", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true } as Response);

    const result = await loginTableWithPin("3", "1234");

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/login/table/3",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("wrong PIN gets the cold shoulder", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const result = await loginTableWithPin("3", "0000");
    expect(result).toBe(false);
  });

  it("network dies mid-login? that's a no from us", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await loginTableWithPin("3", "1234");
    expect(result).toBe(false);
  });
});

describe("Does the backend actually agree with the frontend on passwords?", () => {
  it("kitchen password passes local check then phones home to confirm", async () => {
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

  it("backend says 'nope' to kitchen password — local match doesn't save you", async () => {
    await initializePasswords();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    const result = await verifyKitchenPassword(DEFAULT_KITCHEN_PASSWORD);
    expect(result).toBe(false);
  });

  it("manager password passes locally then checks with the backend too", async () => {
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

  it("backend vetoes manager password — tough luck", async () => {
    await initializePasswords();
    (global.fetch as jest.Mock).mockClear();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false } as Response);

    const result = await verifyManagerPassword(DEFAULT_MANAGER_PASSWORD);
    expect(result).toBe(false);
  });

  it("no stored hash means kitchen password auto-fails", async () => {
    // Do NOT initialize passwords
    const result = await verifyKitchenPassword("anything");
    expect(result).toBe(false);
  });

  it("no stored hash means manager password auto-fails too", async () => {
    const result = await verifyManagerPassword("anything");
    expect(result).toBe(false);
  });
});

describe("Can we change passwords without locking everyone out?", () => {
  it("new kitchen password lands in localStorage AND pings the backend", async () => {
    await updateKitchenPassword("new-kitchen-pw");

    const hash = localStorage.getItem("sushi-dash-kitchen-password");
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64); // SHA-256

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/settings/passwords",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("new manager password stored locally and synced to the server", async () => {
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

describe("Do customer and staff sessions mind their own business?", () => {
  it("customer and staff sessions live in separate drawers", () => {
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

  it("clearing customer session doesn't nuke the staff's login", () => {
    saveAuthSession({ role: "customer", tableId: "1", authenticatedAt: Date.now() });
    saveAuthSession({ role: "manager", authenticatedAt: Date.now() });

    clearAuthSession("customer");

    expect(getAuthSession("customer")).toBeNull();
    expect(getAuthSession("staff")).not.toBeNull();
  });

  it("clearing staff session leaves the customer alone", () => {
    saveAuthSession({ role: "customer", tableId: "2", authenticatedAt: Date.now() });
    saveAuthSession({ role: "kitchen", authenticatedAt: Date.now() });

    clearAuthSession("staff");

    expect(getAuthSession("staff")).toBeNull();
    expect(getAuthSession("customer")).not.toBeNull();
  });

  it("nuclear option: clear everything, no survivors", () => {
    saveAuthSession({ role: "customer", tableId: "1", authenticatedAt: Date.now() });
    saveAuthSession({ role: "manager", authenticatedAt: Date.now() });

    clearAuthSession();

    expect(getAuthSession()).toBeNull();
    expect(getAuthSession("customer")).toBeNull();
    expect(getAuthSession("staff")).toBeNull();
  });
});

describe("Permission resolution hardening", () => {
  it("manager keeps manager permission even with missing explicit permission field", () => {
    const managerWithoutPermission: AuthSession = {
      role: "manager",
      authenticatedAt: Date.now(),
    };

    expect(resolveStaffPermission(managerWithoutPermission)).toBe("manager");
    expect(hasStaffPermission(managerWithoutPermission, "kitchen")).toBe(true);
    expect(hasStaffPermission(managerWithoutPermission, "manager")).toBe(true);
  });

  it("kitchen role cannot escalate to manager", () => {
    const kitchenSession: AuthSession = {
      role: "kitchen",
      permission: "kitchen",
      authenticatedAt: Date.now(),
    };

    expect(hasStaffPermission(kitchenSession, "kitchen")).toBe(true);
    expect(hasStaffPermission(kitchenSession, "manager")).toBe(false);
    expect(hasStaffPermission(kitchenSession, "admin")).toBe(false);
  });
});
