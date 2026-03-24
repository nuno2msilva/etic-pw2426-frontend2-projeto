import "@testing-library/jest-dom";
import React from "react";
import { TextEncoder, TextDecoder } from "util";
import { webcrypto } from "crypto";

// ── Mock next/navigation for Jest ──────────────────────────────────────────
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ── Mock next/link as a plain <a> ──────────────────────────────────────────
jest.mock("next/link", () => {
  type LinkProps = {
    href: string;
    children?: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>;

  return {
    __esModule: true,
    default: React.forwardRef(
      ({ href, children, ...rest }: LinkProps, ref: React.Ref<HTMLAnchorElement>) =>
        React.createElement("a", { href, ref, ...rest }, children)
    ),
  };
});

// Polyfill TextEncoder/TextDecoder for jsdom
Object.defineProperty(globalThis, "TextEncoder", {
  value: TextEncoder,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, "TextDecoder", {
  value: TextDecoder,
  writable: true,
  configurable: true,
});

// Polyfill Web Crypto API for jsdom (must be set on both global and window)
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Polyfill IntersectionObserver for jsdom
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
