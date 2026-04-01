/**
 * Analytics integration tests
 * Verifies that trackEvent fires correctly, retries when Umami hasn't loaded
 * yet, and that all event helpers send the right event names and properties.
 */

import {
  trackEvent,
  customerEvents,
  staffEvents,
  kitchenEvents,
  adminEvents,
} from "@/features/shared/lib/analytics";

// ─── Helpers ────────────────────────────────────────────────────────────────

function setUmami(mock: { track: jest.Mock }) {
  (window as Record<string, unknown>).umami = mock;
}

function clearUmami() {
  delete (window as Record<string, unknown>).umami;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Does trackEvent reach Umami or die trying?", () => {
  beforeEach(() => {
    clearUmami();
    jest.useFakeTimers();
  });

  afterEach(() => {
    clearUmami();
    jest.useRealTimers();
  });

  it("calls umami.track immediately when Umami is already loaded", () => {
    const track = jest.fn();
    setUmami({ track });

    trackEvent("test_event", { foo: "bar" });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("test_event", { foo: "bar" });
  });

  it("does not call track when Umami is absent — waits for retry", () => {
    const track = jest.fn();
    // Umami not set yet
    trackEvent("test_event");
    expect(track).not.toHaveBeenCalled();
  });

  it("retries after 2 seconds when Umami hasn't loaded yet", () => {
    const track = jest.fn();

    trackEvent("delayed_event", { delayed: true });
    expect(track).not.toHaveBeenCalled();

    setUmami({ track });
    jest.advanceTimersByTime(2000);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("delayed_event", { delayed: true });
  });

  it("does not throw if Umami never loads — retry is a silent no-op", () => {
    expect(() => {
      trackEvent("ghost_event");
      jest.advanceTimersByTime(2000);
    }).not.toThrow();
  });

  it("fires without properties when none are passed", () => {
    const track = jest.fn();
    setUmami({ track });

    trackEvent("bare_event");

    expect(track).toHaveBeenCalledWith("bare_event", undefined);
  });
});

describe("Do customer events send the right data to Umami?", () => {
  let track: jest.Mock;

  beforeEach(() => {
    track = jest.fn();
    setUmami({ track });
  });

  afterEach(() => {
    clearUmami();
  });

  it("table_selected carries the table id", () => {
    customerEvents.tableSelected("3");
    expect(track).toHaveBeenCalledWith("table_selected", { table_id: "3" });
  });

  it("pin_entered carries table id and whether it worked", () => {
    customerEvents.pinEntered("2", true);
    expect(track).toHaveBeenCalledWith("pin_entered", {
      table_id: "2",
      success: true,
    });
  });

  it("pin_entered reports failure honestly", () => {
    customerEvents.pinEntered("5", false);
    expect(track).toHaveBeenCalledWith("pin_entered", {
      table_id: "5",
      success: false,
    });
  });

  it("customer_session_started carries the table id", () => {
    customerEvents.sessionStarted("1");
    expect(track).toHaveBeenCalledWith("customer_session_started", {
      table_id: "1",
    });
  });

  it("customer_session_ended carries table id and how long the session lasted", () => {
    customerEvents.sessionEnded("4", 420);
    expect(track).toHaveBeenCalledWith("customer_session_ended", {
      table_id: "4",
      duration_seconds: 420,
    });
  });

  it("order_placed carries table, item count, price, and session duration", () => {
    customerEvents.orderPlaced("1", 5, 0, 300);
    expect(track).toHaveBeenCalledWith("order_placed", {
      table_id: "1",
      item_count: 5,
      total_price: 0,
      session_duration_seconds: 300,
    });
  });

  it("order_cancelled carries the table id", () => {
    customerEvents.orderCancelled("2");
    expect(track).toHaveBeenCalledWith("order_cancelled", { table_id: "2" });
  });
});

describe("Do staff events send the right data to Umami?", () => {
  let track: jest.Mock;

  beforeEach(() => {
    track = jest.fn();
    setUmami({ track });
  });

  afterEach(() => {
    clearUmami();
  });

  it("staff_login_succeeded carries the role", () => {
    staffEvents.loginSucceeded("manager");
    expect(track).toHaveBeenCalledWith("staff_login_succeeded", {
      role: "manager",
    });
  });

  it("staff_login_attempted carries role and outcome", () => {
    staffEvents.loginAttempted("kitchen", false);
    expect(track).toHaveBeenCalledWith("staff_login_attempted", {
      role: "kitchen",
      success: false,
    });
  });

  it("staff_logged_out carries role and session duration", () => {
    staffEvents.loggedOut("manager", 3600);
    expect(track).toHaveBeenCalledWith("staff_logged_out", {
      role: "manager",
      session_duration_seconds: 3600,
    });
  });

  it("staff_password_changed carries the role", () => {
    staffEvents.passwordChanged("admin");
    expect(track).toHaveBeenCalledWith("staff_password_changed", {
      role: "admin",
    });
  });

  it("staff_unauthorized_access carries role and the route they tried", () => {
    staffEvents.unauthorized("kitchen", "/manager");
    expect(track).toHaveBeenCalledWith("staff_unauthorized_access", {
      role: "kitchen",
      route: "/manager",
    });
  });
});

describe("Do kitchen events send the right data to Umami?", () => {
  let track: jest.Mock;

  beforeEach(() => {
    track = jest.fn();
    setUmami({ track });
  });

  afterEach(() => {
    clearUmami();
  });

  it("kitchen_order_received carries order id and item count", () => {
    kitchenEvents.orderReceived("order-abc", 3);
    expect(track).toHaveBeenCalledWith("kitchen_order_received", {
      order_id: "order-abc",
      item_count: 3,
    });
  });

  it("kitchen_order_status_changed carries order id and new status", () => {
    kitchenEvents.orderStatusChanged("order-abc", "ready");
    expect(track).toHaveBeenCalledWith("kitchen_order_status_changed", {
      order_id: "order-abc",
      status: "ready",
    });
  });

  it("kitchen_order_cancelled defaults reason to 'unknown' when not provided", () => {
    kitchenEvents.orderCancelled("order-xyz");
    expect(track).toHaveBeenCalledWith("kitchen_order_cancelled", {
      order_id: "order-xyz",
      reason: "unknown",
    });
  });

  it("kitchen_order_cancelled carries explicit reason when provided", () => {
    kitchenEvents.orderCancelled("order-xyz", "customer request");
    expect(track).toHaveBeenCalledWith("kitchen_order_cancelled", {
      order_id: "order-xyz",
      reason: "customer request",
    });
  });
});

describe("Do admin events send the right data to Umami?", () => {
  let track: jest.Mock;

  beforeEach(() => {
    track = jest.fn();
    setUmami({ track });
  });

  afterEach(() => {
    clearUmami();
  });

  it("admin_menu_item_added carries name, category, and price", () => {
    adminEvents.menuItemAdded("Salmon Roll", "Rolls", 12);
    expect(track).toHaveBeenCalledWith("admin_menu_item_added", {
      item_name: "Salmon Roll",
      category: "Rolls",
      price: 12,
    });
  });
});
