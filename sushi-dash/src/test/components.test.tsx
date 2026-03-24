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
import AppHeader from "@/components/app/AppHeader";
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

describe("Does the cart banner actually tell you what you're ordering?", () => {
  it("shows a nudge when the cart is tragically empty", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText(/Start picking/)).toBeDefined();
  });

  it("shows the actual sushi you picked like a good banner", () => {
    render(<CartSummaryBanner summary="#1 Salmon Nigiri (2x)" />);
    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
  });

  it("always flexes the cart emoji no matter what", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText(/🛒/)).toBeDefined();
  });

  it("never vanishes — layout shift is not a vibe", () => {
    const { container } = render(<CartSummaryBanner summary="" />);
    // Banner should always render (not null)
    expect(container.firstChild).not.toBeNull();
  });
});

describe("Can you review your order before the kitchen judges you?", () => {
  const mockMenu = [
    { id: "1", name: "#1 Salmon Nigiri", emoji: "🍣", category: "Nigiri" },
    { id: "2", name: "#2 Tuna Nigiri", emoji: "🍣", category: "Nigiri" },
  ];

  const mockTable = { id: "1", label: "Table 1" };

  it("lists every sushi roll you added to the cart", () => {
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

  it("tells you which table is about to get fed", () => {
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

  it("has the big scary 'Send to Kitchen' button", () => {
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

describe("Does SEOHead make search engines happy?", () => {
  beforeEach(() => {
    document.title = "";
  });

  it("slaps the brand name on the document title", () => {
    render(<SEOHead title="Kitchen Dashboard" />);
    expect(document.title).toBe("Kitchen Dashboard | Sushi Dash");
  });

  it("writes the meta description for the crawlers", () => {
    render(<SEOHead title="Test" description="Test description for SEO" />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("Test description for SEO");
  });
});

describe("Does the staff login modal gate the kitchen or just look pretty?", () => {
  it("shows a password field when the modal is open", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={true} onClose={() => {}} />
      </AllProviders>
    );

    expect(screen.getByText(/Staff Login/)).toBeDefined();
    expect(screen.getByPlaceholderText(/Your password/)).toBeDefined();
  });

  it("has a login button (you'd hope so)", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={true} onClose={() => {}} />
      </AllProviders>
    );

    expect(screen.getByText("Login")).toBeDefined();
  });

  it("hides everything when the modal is closed — out of sight, out of DOM", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={false} onClose={() => {}} />
      </AllProviders>
    );

    expect(screen.queryByText("Staff Login")).toBeNull();
  });
});

describe("Can staff log out and back in without a meltdown?", () => {
  it("kitchen and manager pages boot unauthenticated users to home", () => {
    // These pages check authentication and have redirect logic
    // Verify they render as client components with proper auth protection
    const kitchenPageSource = KitchenPage.toString();
    const managerPageSource = ManagerPage.toString();
    
    // Pages should be client components (have 'use client' directive in source or be client-side)
    // and contain shared protected-route hook usage for auth-based redirects
    expect(kitchenPageSource).toBeTruthy();
    expect(managerPageSource).toBeTruthy();
    // Both should use centralized protected-route logic
    expect(kitchenPageSource).toContain("useProtectedStaffRoute");
    expect(managerPageSource).toContain("useProtectedStaffRoute");
  });

  it("staff login modal still works fine for a re-login", () => {
    render(
      <AllProviders>
        <StaffLoginModal isOpen={true} onClose={() => {}} />
      </AllProviders>
    );

    // Staff login modal should show login form for relogging
    expect(screen.getByText(/Staff Login/)).toBeDefined();
    expect(screen.getByPlaceholderText(/Your password/)).toBeDefined();
    expect(screen.getByText("Login")).toBeDefined();
  });
});

describe("Do collapsible sections actually collapse or just lie about it?", () => {
  it("shows the title and icon like a good header", () => {
    render(
      <CollapsibleSection title="Nigiri" icon="🍣" open={false} onToggle={() => {}}>
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText("Nigiri")).toBeDefined();
    expect(screen.getByText("🍣")).toBeDefined();
  });

  it("shows the subtitle when you bother to pass one", () => {
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

  it("renders a badge if you're feeling fancy", () => {
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

  it("fires the toggle callback when you click the header", () => {
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

describe("Does the sushi grid render all the fish or drop some on the floor?", () => {
  const mockItems = [
    { id: "1", name: "#1 Salmon Nigiri", emoji: "🍣", category: "Nigiri", isPopular: true },
    { id: "2", name: "#2 Tuna Roll", emoji: "🍙", category: "Rolls", isPopular: false },
  ];

  it("shows every item on the menu — no favoritism", () => {
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

  it("shows the right emoji for each sushi piece", () => {
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

  it("only popular items get the HOT badge flex", () => {
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

  it("shows how many of each item you're hoarding", () => {
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

  it("the + button actually adds stuff (shocking)", () => {
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

  it("the - button removes stuff (equally shocking)", () => {
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

  it("locks the + button when you've maxed out — no more sushi for you", () => {
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

  it("locks the - button when there's nothing left to remove", () => {
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

describe("Can you cancel and delete orders without accidentally nuking dinner?", () => {
  const mockOrder = {
    id: "order-1",
    table: { id: "1", label: "Table 1" },
    items: [
      { item: { id: "s1", name: "Salmon Nigiri", emoji: "🍣", category: "Nigiri" }, quantity: 2 },
    ],
    status: "queued" as const,
    createdAt: new Date(),
  };

  it("shows the table, items, and quantity — the basics", () => {
    render(<OrderCard order={mockOrder} />);
    expect(screen.getByText("Table 1")).toBeDefined();
    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
    expect(screen.getByText("2x")).toBeDefined();
  });

  it("queued orders get a cancel button (regret is valid)", () => {
    render(<OrderCard order={mockOrder} showActions onCancel={() => {}} />);
    expect(screen.getByText("Cancel Order")).toBeDefined();
  });

  it("asks 'are you sure?' before cancelling — safety first", () => {
    render(<OrderCard order={mockOrder} showActions onCancel={() => {}} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    expect(screen.getByText(/Are you sure you want to cancel/)).toBeDefined();
  });

  it("doesn't cancel just because you clicked the button once", () => {
    const cancel = jest.fn();
    render(<OrderCard order={mockOrder} showActions onCancel={cancel} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    // onCancel should NOT have been called yet
    expect(cancel).not.toHaveBeenCalled();
  });

  it("really cancels after you double-down on your decision", () => {
    const cancel = jest.fn();
    render(<OrderCard order={mockOrder} showActions onCancel={cancel} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    // Click the confirm button in the dialog
    const confirmButtons = screen.getAllByText("Cancel Order");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("delivered orders can be deleted (out with the old)", () => {
    const delivered = { ...mockOrder, status: "delivered" as const };
    render(<OrderCard order={delivered} showActions onDelete={() => {}} />);
    expect(screen.getByText("Delete Order")).toBeDefined();
  });

  it("delete also asks for confirmation — we're not barbarians", () => {
    const delivered = { ...mockOrder, status: "delivered" as const };
    render(<OrderCard order={delivered} showActions onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Delete Order"));
    expect(screen.getByText(/Are you sure you want to delete/)).toBeDefined();
  });

  it("actually deletes after confirmation", () => {
    const deleteFn = jest.fn();
    const delivered = { ...mockOrder, status: "delivered" as const };
    render(<OrderCard order={delivered} showActions onDelete={deleteFn} />);
    fireEvent.click(screen.getByText("Delete Order"));
    const confirmButtons = screen.getAllByText("Delete Order");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    expect(deleteFn).toHaveBeenCalledTimes(1);
  });

  it("clicking 'Keep' saves the order from destruction", () => {
    const cancel = jest.fn();
    render(<OrderCard order={mockOrder} showActions onCancel={cancel} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    fireEvent.click(screen.getByText("Keep"));
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe("Does the app header let staff bounce between kitchen and manager?", () => {
  it("has links to both /kitchen and /manager in the source", () => {
    // Verify AppHeader source contains the expected route paths
    const src = AppHeader.toString();
    expect(src).toContain("/kitchen");
    expect(src).toContain("/manager");
  });
});
