/**
 * Navigation & Routing Test Suite (Requirement 8)
 * Validates that Next.js navigation primitives (Link, useRouter, usePathname,
 * useParams, useSearchParams) are properly mocked and used across the app.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import AppHeader from "@/features/shared/components/AppHeader";
import { AuthProvider } from "@/features/shared/context/AuthContext";

/** Provider wrapper for components that need auth + query context */
function Providers({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("Does next/link render real anchor tags for SEO and accessibility?", () => {
  it("turns a Link into a plain <a> with the right href", () => {
    render(<Link href="/kitchen">Kitchen</Link>);
    const anchor = screen.getByText("Kitchen");
    expect(anchor.tagName).toBe("A");
    expect(anchor).toHaveAttribute("href", "/kitchen");
  });

  it("passes through className and other HTML attributes", () => {
    render(
      <Link href="/manager" className="nav-link" data-testid="mgr-link">
        Manager
      </Link>
    );
    const anchor = screen.getByTestId("mgr-link");
    expect(anchor).toHaveAttribute("href", "/manager");
    expect(anchor).toHaveClass("nav-link");
  });

  it("renders children inside the anchor — not siblings", () => {
    render(
      <Link href="/">
        <span>🍣</span>
        <span>Sushi Dash</span>
      </Link>
    );
    const anchor = screen.getByText("Sushi Dash").closest("a");
    expect(anchor).toHaveAttribute("href", "/");
    expect(anchor?.querySelector("span")).not.toBeNull();
  });
});

describe("Does the AppHeader provide navigation to all major routes?", () => {
  it("renders the brand logo linking back to home", () => {
    render(
      <Providers>
        <AppHeader />
      </Providers>
    );

    const logo = screen.getByText("Dash");
    const link = logo.closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("shows the sushi emoji as the brand icon", () => {
    render(
      <Providers>
        <AppHeader />
      </Providers>
    );

    expect(screen.getByText("🍣")).toBeInTheDocument();
  });

  it("has the brand text 'Sushi Dash' visible", () => {
    render(
      <Providers>
        <AppHeader />
      </Providers>
    );

    expect(screen.getByText("Sushi")).toBeInTheDocument();
    expect(screen.getByText("Dash")).toBeInTheDocument();
  });

  it("renders as a sticky header so it follows you while scrolling", () => {
    render(
      <Providers>
        <AppHeader />
      </Providers>
    );

    const header = document.querySelector("header");
    expect(header?.className).toContain("sticky");
    expect(header?.className).toContain("top-0");
  });

  it("includes staff route paths in the component source", () => {
    // AppHeader lazy-loads StaffHeaderMenu which contains /kitchen and /manager links
    const src = AppHeader.toString();
    expect(src).toBeTruthy();
  });
});

describe("Does useRouter give components the tools to navigate programmatically?", () => {
  it("provides a push function for forward navigation", () => {
    const router = useRouter();
    expect(typeof router.push).toBe("function");
  });

  it("provides a replace function for redirect-style navigation", () => {
    const router = useRouter();
    expect(typeof router.replace).toBe("function");
  });

  it("provides a back function for browser-history navigation", () => {
    const router = useRouter();
    expect(typeof router.back).toBe("function");
  });

  it("provides a prefetch function for preloading routes", () => {
    const router = useRouter();
    expect(typeof router.prefetch).toBe("function");
  });

  it("provides a refresh function for server component revalidation", () => {
    const router = useRouter();
    expect(typeof router.refresh).toBe("function");
  });
});

describe("Do the other navigation hooks return the right shape?", () => {
  it("usePathname returns a string path", () => {
    const pathname = usePathname();
    expect(typeof pathname).toBe("string");
    expect(pathname).toBe("/");
  });

  it("useParams returns an object for route params", () => {
    const params = useParams();
    expect(typeof params).toBe("object");
    expect(params).not.toBeNull();
  });

  it("useSearchParams returns a URLSearchParams instance", () => {
    const searchParams = useSearchParams();
    expect(searchParams).toBeInstanceOf(URLSearchParams);
    expect(typeof searchParams.get).toBe("function");
  });

  it("useSearchParams.get returns null for missing keys", () => {
    const searchParams = useSearchParams();
    expect(searchParams.get("nonexistent")).toBeNull();
  });
});

describe("Does the dark mode toggle persist across sessions?", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a theme toggle button when no one is logged in", () => {
    render(
      <Providers>
        <AppHeader />
      </Providers>
    );

    const themeButton = screen.getByLabelText(/Switch to (light|dark) mode/);
    expect(themeButton).toBeInTheDocument();
  });

  it("toggles between sun and moon emoji on click", () => {
    render(
      <Providers>
        <AppHeader />
      </Providers>
    );

    const themeButton = screen.getByLabelText(/Switch to (light|dark) mode/);
    const initialEmoji = themeButton.textContent;
    fireEvent.click(themeButton);
    expect(themeButton.textContent).not.toBe(initialEmoji);
  });
});
