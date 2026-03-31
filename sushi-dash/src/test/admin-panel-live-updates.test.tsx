import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AdminPanel } from "@/features/admin/components/AdminPanel";

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("Does the admin panel stay fresh with live data?", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("refreshes the last-login time and hides password previews after polling", async () => {
    const firstPayload = {
      users: [
        {
          id: 1,
          email: "manager@sushi-dash.dev",
          username: "manager",
          permission: "manager",
          isActive: true,
          passwordPreview: "Temp-1234",
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const secondPayload = {
      users: [
        {
          ...firstPayload.users[0],
          passwordPreview: null,
          lastLoginAt: "2026-03-24T10:00:00.000Z",
        },
      ],
    };

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => firstPayload } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => secondPayload } as Response);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getAllByText("Temp-1234").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Never/i).length).toBeGreaterThan(0);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getAllByText("No longer available").length).toBeGreaterThan(0);
    });

    expect(screen.queryAllByText("Temp-1234")).toHaveLength(0);
    expect(screen.queryAllByText(/Never/i)).toHaveLength(0);
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
