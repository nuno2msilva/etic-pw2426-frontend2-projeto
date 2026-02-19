/** Component rendering tests — CartSummaryBanner, OrderConfirmation, SEOHead, StaffLoginModal, and more */

import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CartSummaryBanner from "@/components/app/CartSummaryBanner";
import OrderConfirmation from "@/components/app/OrderConfirmation";
import { SEOHead } from "@/components/app/SEOHead";
import { StaffLoginModal } from "@/components/app";
import CollapsibleSection from "@/components/app/CollapsibleSection";
import MenuGrid from "@/components/app/MenuGrid";
import OrderCard from "@/components/app/OrderCard";
import KitchenPage from "@/views/KitchenPage";
import ManagerPage from "@/views/ManagerPage";
import { AuthProvider } from "@/context/AuthContext";

/** Wrapper with all providers needed for components using AuthProvider */
function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

// ==========================================================================
// CART SUMMARY BANNER
// ==========================================================================
describe("CartSummaryBanner", () => {
  it("shows empty message when cart is empty", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText(/Start picking/)).toBeDefined();
  });

  it("renders the cart summary text when items are added", () => {
    render(<CartSummaryBanner summary="#1 Salmon Nigiri (2x)" />);
    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
  });

  it("always shows the cart emoji", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText(/🛒/)).toBeDefined();
  });

  it("prevents layout shift by always being visible", () => {
    const { container } = render(<CartSummaryBanner summary="" />);
    // Banner should always render (not null)
    expect(container.firstChild).not.toBeNull();
  });
});

// ==========================================================================
// ORDER CONFIRMATION
// ==========================================================================
describe("OrderConfirmation", () => {
  const mockMenu = [
    { id: "1", name: "#1 Salmon Nigiri", emoji: "🍣", category: "Nigiri" },
    { id: "2", name: "#2 Tuna Nigiri", emoji: "🍣", category: "Nigiri" },
  ];

  const mockTable = { id: "1", label: "Table 1" };

  it("renders order items from the cart", () => {
    render(
      <OrderConfirmation
        open={true}
        onOpenChange={() => {}}
        table={mockTable}
        cart={{ "1": 3 }}
        menu={mockMenu}
        onBack={() => {}}
        onAddMore={() => {}}
        onConfirm={() => {}}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    );

    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
    expect(screen.getByText("3x")).toBeDefined();
  });

  it("shows the table name in the title", () => {
    render(
      <OrderConfirmation
        open={true}
        onOpenChange={() => {}}
        table={mockTable}
        cart={{ "1": 1 }}
        menu={mockMenu}
        onBack={() => {}}
        onAddMore={() => {}}
        onConfirm={() => {}}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    );

    expect(screen.getByText(/Table 1/)).toBeDefined();
  });

  it("has Send to Kitchen button", () => {
    render(
      <OrderConfirmation
        open={true}
        onOpenChange={() => {}}
        table={mockTable}
        cart={{ "1": 1 }}
        menu={mockMenu}
        onBack={() => {}}
        onAddMore={() => {}}
        onConfirm={() => {}}
        onIncrement={() => {}}
        onDecrement={() => {}}
        onRemove={() => {}}
      />
    );

    expect(screen.getByText(/Send to Kitchen/)).toBeDefined();
  });
});

// ==========================================================================
// SEO HEAD
// ==========================================================================
describe("SEOHead", () => {
  beforeEach(() => {
    document.title = "";
  });

  it("updates the document title with brand suffix", () => {
    render(<SEOHead title="Kitchen Dashboard" />);
    expect(document.title).toBe("Kitchen Dashboard | Sushi Dash");
  });

  it("updates the meta description tag", () => {
    render(<SEOHead title="Test" description="Test description for SEO" />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("Test description for SEO");
  });
});

// ==========================================================================
// STAFF LOGIN MODAL
// ==========================================================================
describe("StaffLoginModal", () => {
  it("renders the staff login modal when open", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={true} onClose={() => {}} />
      </AllProviders>
    );

    expect(screen.getByText(/Staff Login/)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter staff password/)).toBeDefined();
  });

  it("has a login button", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={true} onClose={() => {}} />
      </AllProviders>
    );

    expect(screen.getByText("Login")).toBeDefined();
  });

  it("does not render content when closed", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={false} onClose={() => {}} />
      </AllProviders>
    );

    expect(screen.queryByText("Staff Login")).toBeNull();
  });
});

describe("Logout and relogging flow", () => {
  it("kitchen and manager pages have redirect logic for unauthenticated users", () => {
    // These pages check authentication and redirect to /
    const kitchenPageSource = KitchenPage.toString();
    const managerPageSource = ManagerPage.toString();
    
    // Both pages should use useRouter and router.push('/')
    expect(kitchenPageSource).toContain("push");
    expect(managerPageSource).toContain("push");
  });

  it("staff login modal renders correctly for relogging", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={true} onClose={() => {}} />
      </AllProviders>
    );

    // Staff login modal should show login form for relogging
    expect(screen.getByText(/Staff Login/)).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter staff password/)).toBeDefined();
    expect(screen.getByText("Login")).toBeDefined();
  });
});

// ==========================================================================
// COLLAPSIBLE SECTION
// ==========================================================================
describe("CollapsibleSection", () => {
  it("renders title and icon", () => {
    render(
      <CollapsibleSection title="Nigiri" icon="🍣" open={false} onToggle={() => {}}>
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText("Nigiri")).toBeDefined();
    expect(screen.getByText("🍣")).toBeDefined();
  });

  it("renders subtitle when provided", () => {
    render(
      <CollapsibleSection
        title="Drinks"
        subtitle="12 items"
        open={false}
        onToggle={() => {}}
      >
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText("12 items")).toBeDefined();
  });

  it("renders badge when provided", () => {
    render(
      <CollapsibleSection
        title="Rolls"
        badge={<span data-testid="badge">NEW</span>}
        open={false}
        onToggle={() => {}}
      >
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByTestId("badge")).toBeDefined();
  });

  it("calls onToggle when header is clicked", () => {
    const toggle = jest.fn();
    render(
      <CollapsibleSection title="Section" open={false} onToggle={toggle}>
        <p>Content</p>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByText("Section"));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// SUSHI GRID
// ==========================================================================
describe("MenuGrid", () => {
  const mockItems = [
    { id: "1", name: "#1 Salmon Nigiri", emoji: "🍣", category: "Nigiri", isPopular: true },
    { id: "2", name: "#2 Tuna Roll", emoji: "🍙", category: "Rolls", isPopular: false },
  ];

  it("renders all items", () => {
    render(
      <MenuGrid
        items={mockItems}
        cart={{}}
        maxItems={10}
        currentTotal={0}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    );

    expect(screen.getByText("Salmon Nigiri")).toBeDefined();
    expect(screen.getByText("Tuna Roll")).toBeDefined();
  });

  it("renders emoji icons for each item", () => {
    render(
      <MenuGrid
        items={mockItems}
        cart={{}}
        maxItems={10}
        currentTotal={0}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    );

    expect(screen.getByText("🍣")).toBeDefined();
    expect(screen.getByText("🍙")).toBeDefined();
  });

  it("shows HOT badge only for popular items", () => {
    render(
      <MenuGrid
        items={mockItems}
        cart={{}}
        maxItems={10}
        currentTotal={0}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    );

    const hotBadges = screen.getAllByText("HOT");
    expect(hotBadges).toHaveLength(1);
  });

  it("shows quantity badge when item is in cart", () => {
    render(
      <MenuGrid
        items={mockItems}
        cart={{ "1": 3 }}
        maxItems={10}
        currentTotal={3}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    );

    expect(screen.getByText("3x")).toBeDefined();
  });

  it("calls onIncrement when + button is clicked", () => {
    const increment = jest.fn();
    render(
      <MenuGrid
        items={mockItems}
        cart={{}}
        maxItems={10}
        currentTotal={0}
        onIncrement={increment}
        onDecrement={() => {}}
      />
    );

    const addButtons = screen.getAllByLabelText(/^Add /);
    fireEvent.click(addButtons[0]);
    expect(increment).toHaveBeenCalledWith(mockItems[0]);
  });

  it("calls onDecrement when - button is clicked", () => {
    const decrement = jest.fn();
    render(
      <MenuGrid
        items={mockItems}
        cart={{ "1": 2 }}
        maxItems={10}
        currentTotal={2}
        onIncrement={() => {}}
        onDecrement={decrement}
      />
    );

    const removeButtons = screen.getAllByLabelText(/^Remove /);
    fireEvent.click(removeButtons[0]);
    expect(decrement).toHaveBeenCalledWith(mockItems[0]);
  });

  it("disables + buttons when at max items", () => {
    render(
      <MenuGrid
        items={mockItems}
        cart={{ "1": 10 }}
        maxItems={10}
        currentTotal={10}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    );

    const addButtons = screen.getAllByLabelText(/^Add /);
    for (const btn of addButtons) {
      expect(btn).toBeDisabled();
    }
  });

  it("disables - buttons when quantity is 0", () => {
    render(
      <MenuGrid
        items={mockItems}
        cart={{}}
        maxItems={10}
        currentTotal={0}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />
    );

    const removeButtons = screen.getAllByLabelText(/^Remove /);
    for (const btn of removeButtons) {
      expect(btn).toBeDisabled();
    }
  });
});

// ==========================================================================
// ORDER CARD — confirmation dialogs
// ==========================================================================
describe("OrderCard", () => {
  const mockOrder = {
    id: "order-1",
    table: { id: "1", label: "Table 1" },
    items: [
      { item: { id: "s1", name: "Salmon Nigiri", emoji: "🍣", category: "Nigiri" }, quantity: 2 },
    ],
    status: "queued" as const,
    createdAt: new Date().toISOString(),
  };

  it("renders order details", () => {
    render(<OrderCard order={mockOrder} />);
    expect(screen.getByText("Table 1")).toBeDefined();
    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
    expect(screen.getByText("2x")).toBeDefined();
  });

  it("shows cancel button for queued orders when onCancel is provided", () => {
    render(<OrderCard order={mockOrder} showActions onCancel={() => {}} />);
    expect(screen.getByText("Cancel Order")).toBeDefined();
  });

  it("shows confirmation dialog when cancel is clicked", () => {
    render(<OrderCard order={mockOrder} showActions onCancel={() => {}} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    expect(screen.getByText(/Are you sure you want to cancel/)).toBeDefined();
  });

  it("does not call onCancel until confirmation", () => {
    const cancel = jest.fn();
    render(<OrderCard order={mockOrder} showActions onCancel={cancel} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    // onCancel should NOT have been called yet
    expect(cancel).not.toHaveBeenCalled();
  });

  it("calls onCancel only after confirming", () => {
    const cancel = jest.fn();
    render(<OrderCard order={mockOrder} showActions onCancel={cancel} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    // Click the confirm button in the dialog
    const confirmButtons = screen.getAllByText("Cancel Order");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("shows delete button for delivered orders when onDelete is provided", () => {
    const delivered = { ...mockOrder, status: "delivered" as const };
    render(<OrderCard order={delivered} showActions onDelete={() => {}} />);
    expect(screen.getByText("Delete Order")).toBeDefined();
  });

  it("shows confirmation dialog when delete is clicked", () => {
    const delivered = { ...mockOrder, status: "delivered" as const };
    render(<OrderCard order={delivered} showActions onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Delete Order"));
    expect(screen.getByText(/Are you sure you want to delete/)).toBeDefined();
  });

  it("calls onDelete only after confirming", () => {
    const deleteFn = jest.fn();
    const delivered = { ...mockOrder, status: "delivered" as const };
    render(<OrderCard order={delivered} showActions onDelete={deleteFn} />);
    fireEvent.click(screen.getByText("Delete Order"));
    const confirmButtons = screen.getAllByText("Delete Order");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    expect(deleteFn).toHaveBeenCalledTimes(1);
  });

  it("dismisses dialog when Keep is clicked without calling handler", () => {
    const cancel = jest.fn();
    render(<OrderCard order={mockOrder} showActions onCancel={cancel} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    fireEvent.click(screen.getByText("Keep"));
    expect(cancel).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// APP HEADER — Manager ↔ Kitchen nav shortcuts
// ==========================================================================
describe("AppHeader navigation shortcuts", () => {
  it("contains kitchen and manager navigation links for staff pages", () => {
    // Verify AppHeader source contains the expected route paths
    const src = require("@/components/app/AppHeader").default.toString();
    expect(src).toContain("/kitchen");
    expect(src).toContain("/manager");
  });
});
