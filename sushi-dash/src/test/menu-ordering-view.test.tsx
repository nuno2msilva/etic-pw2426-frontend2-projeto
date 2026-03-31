import { fireEvent, render, screen } from "@testing-library/react";
import type { OrderingFlow } from "@/features/customer/hooks/useOrderingFlow";
import type { MenuItem, Table } from "@/features/shared/types/models";
import MenuOrderingView from "@/features/customer/components/MenuOrderingView";
import { useApp } from "@/features/customer/context/AppContext";

jest.mock("@/features/customer/context/AppContext", () => ({
  useApp: jest.fn(),
}));

const mockedUseApp = useApp as jest.Mock;

function createFlow(overrides: Partial<OrderingFlow> = {}): OrderingFlow {
  const baseItem: MenuItem = {
    id: "1",
    name: "Salmon Nigiri",
    emoji: "🍣",
    category: "Nigiri",
    isPopular: true,
    isAvailable: true,
  };

  return {
    cart: {},
    setCart: jest.fn(),
    openCategories: new Set(["Nigiri"]),
    setOpenCategories: jest.fn(),
    showConfirm: false,
    setShowConfirm: jest.fn(),
    showProgress: false,
    setShowProgress: jest.fn(),
    totalItems: 0,
    canAddMore: true,
    cartSummary: "",
    menuByCategory: { Nigiri: [baseItem] },
    cartByCategory: {},
    tableOrders: [],
    tableOrderStatus: { allowed: true },
    handleIncrement: jest.fn(),
    handleDecrement: jest.fn(),
    handleRemoveItem: jest.fn(),
    handlePlaceOrder: jest.fn(),
    handleClearCart: jest.fn(),
    toggleCategory: jest.fn(),
    handleBackToMenu: jest.fn(),
    ...overrides,
  };
}

describe("Does the ordering view handle phones, limits, and accessibility?", () => {
  const table: Table = { id: "1", label: "Table 1" } as Table;

  beforeEach(() => {
    mockedUseApp.mockReturnValue({
      menu: [
        {
          id: "1",
          name: "Salmon Nigiri",
          emoji: "🍣",
          category: "Nigiri",
          isPopular: true,
          isAvailable: true,
        },
      ],
      orders: [],
      categories: ["Nigiri"],
      settings: { maxItemsPerOrder: 10, maxActiveOrdersPerTable: 2 },
      cancelOrder: jest.fn(),
    });
  });

  it("has an accessible label on the orders button for screen readers", () => {
    render(<MenuOrderingView table={table} flow={createFlow()} />);

    expect(screen.getByLabelText("View order progress")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("opens the order progress modal when you tap the orders button", () => {
    const setShowProgress = jest.fn();
    render(
      <MenuOrderingView
        table={table}
        flow={createFlow({ setShowProgress })}
      />
    );

    fireEvent.click(screen.getByLabelText("View order progress"));
    expect(setShowProgress).toHaveBeenCalledWith(true);
  });

  it("turns the queue counter red when you've hit the active-order limit", () => {
    render(
      <MenuOrderingView
        table={table}
        flow={createFlow({
          tableOrderStatus: { allowed: false, reason: "Limit reached" },
          tableOrders: [
            {
              id: "o-1",
              table,
              items: [],
              status: "queued",
              createdAt: new Date(),
            },
            {
              id: "o-2",
              table,
              items: [],
              status: "preparing",
              createdAt: new Date(),
            },
          ],
        })}
      />
    );

    const counter = screen.getByText("2/2");
    expect(counter.className).toContain("text-destructive");
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("gives categories and items their own scrollable zone on mobile", () => {
    const { container } = render(<MenuOrderingView table={table} flow={createFlow()} />);

    const scrollRegion = container.querySelector(".mobile-scroll-area");
    expect(scrollRegion).toBeInTheDocument();
    expect(scrollRegion?.className).toContain("overflow-y-auto");
    expect(scrollRegion?.className).toContain("flex-1");
  });

  it("keeps the cart controls pinned at the bottom where your thumb can reach", () => {
    render(
      <MenuOrderingView
        table={table}
        flow={createFlow({ cartSummary: "Salmon Nigiri (1x)", totalItems: 1 })}
        showClearCart
      />
    );

    expect(screen.getByText("🛒")).toBeInTheDocument();
    expect(screen.getByLabelText("Review order")).toBeInTheDocument();
    expect(screen.getByLabelText("Clear cart")).toBeInTheDocument();
  });

  it("hides the review button when the cart is empty — nothing to review", () => {
    render(<MenuOrderingView table={table} flow={createFlow({ cartSummary: "", totalItems: 0 })} />);

    expect(screen.queryByLabelText("Review order")).toBeNull();
  });
});
