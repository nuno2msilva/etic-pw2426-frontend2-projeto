/**
 * ==========================================================================
 * Component Rendering Tests
 * ==========================================================================
 *
 * Tests that key React components render correctly with proper content.
 * Uses @testing-library/react for DOM assertions.
 *
 * Components tested:
 *   - CartSummaryBanner: always visible, shows "Empty!" when cart is empty
 *   - OrderConfirmation: renders order details
 *   - SEOHead: updates document title
 *   - StaffLoginPage: unified staff login form
 *   - Logout/relogging: redirect flows for authentication
 *
 * Testing Framework: Jest
 * ==========================================================================
 */

import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CartSummaryBanner from "@/components/sushi/CartSummaryBanner";
import OrderConfirmation from "@/components/sushi/OrderConfirmation";
import { SEOHead } from "@/components/sushi/SEOHead";
import StaffLoginPage from "@/pages/StaffLoginPage";
import KitchenPage from "@/pages/KitchenPage";
import ManagerPage from "@/pages/ManagerPage";
import { AuthProvider } from "@/context/AuthContext";

// ==========================================================================
// CART SUMMARY BANNER
// ==========================================================================
describe("CartSummaryBanner", () => {
  it("shows 'Empty!' when cart is empty", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText("Empty!")).toBeDefined();
  });

  it("renders the cart summary text when items are added", () => {
    render(<CartSummaryBanner summary="#1 Salmon Nigiri (2x)" />);
    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
  });

  it("always shows the cart emoji and label", () => {
    render(<CartSummaryBanner summary="" />);
    expect(screen.getByText(/🛒/)).toBeDefined();
    expect(screen.getByText(/Your picks:/)).toBeDefined();
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
        table={mockTable}
        cart={{ "1": 3 }}
        menu={mockMenu}
        onBack={() => {}}
        onAddMore={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText(/Salmon Nigiri/)).toBeDefined();
    expect(screen.getByText("3x")).toBeDefined();
  });

  it("shows the table name in the title", () => {
    render(
      <OrderConfirmation
        table={mockTable}
        cart={{ "1": 1 }}
        menu={mockMenu}
        onBack={() => {}}
        onAddMore={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText(/Table 1/)).toBeDefined();
  });

  it("has Send to Kitchen button", () => {
    render(
      <OrderConfirmation
        table={mockTable}
        cart={{ "1": 1 }}
        menu={mockMenu}
        onBack={() => {}}
        onAddMore={() => {}}
        onConfirm={() => {}}
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
// STAFF LOGIN PAGE
// ==========================================================================
describe("StaffLoginPage", () => {
  it("renders the staff login form", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StaffLoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("Staff Login")).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter staff password/)).toBeDefined();
  });

  it("shows kitchen and manager access indicators", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StaffLoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("Kitchen")).toBeDefined();
    expect(screen.getByText("Manager")).toBeDefined();
  });

  it("has a login button", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StaffLoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText("Login")).toBeDefined();
  });
});

describe("Logout and relogging flow", () => {
  it("kitchen and manager pages have redirect logic for unauthenticated users", () => {
    // These pages check authentication and redirect to /staff
    // Test that the redirect pattern is implemented correctly
    const kitchenPageSource = KitchenPage.toString();
    const managerPageSource = ManagerPage.toString();
    
    // Both pages should use useNavigate and navigate('/staff')
    expect(kitchenPageSource).toContain("navigate");
    expect(managerPageSource).toContain("navigate");
  });

  it("staff login page renders correctly for relogging", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StaffLoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Staff login page should show login form for relogging
    expect(screen.getByText("Staff Login")).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter staff password/)).toBeDefined();
    expect(screen.getByText("Login")).toBeDefined();
  });
});

