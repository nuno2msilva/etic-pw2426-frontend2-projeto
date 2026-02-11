/**
 * NavLink.tsx
 * ---------------------------------------------------------------------------
 * Thin wrapper around React Router's `<NavLink>` that adds compatibility
 * with a simpler className API. Instead of requiring a render-function for
 * `className`, this component accepts plain strings for `className`,
 * `activeClassName`, and `pendingClassName` and merges them using `cn()`.
 *
 * Uses `forwardRef` so parent components can pass a ref to the underlying
 * `<a>` element if needed.
 *
 * Used in: AppHeader navigation links
 * ---------------------------------------------------------------------------
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
