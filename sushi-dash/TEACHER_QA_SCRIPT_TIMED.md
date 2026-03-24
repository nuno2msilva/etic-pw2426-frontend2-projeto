# Timed Oral Defense Script (30s / 90s / 3min)

Use this during presentation practice:
- 30s: quick answer under pressure
- 90s: standard viva answer
- 3min: deep technical defense

## 1) Core Stack and Project Structure

### Q1. Why did you choose Next.js instead of Vite/CRA?
- 30s: I needed routing, SEO metadata, server rendering options, and easy Vercel deployment in one framework.
- 90s: Next.js gave us App Router, page metadata, route handlers, and hybrid rendering patterns. Vite/CRA would require extra libraries and integration effort for the same capabilities.
- 3min: This project needed more than SPA behavior. We needed structured routing, server-aware architecture, SEO-friendly metadata, API integration paths, and deployment alignment. Next.js gives those primitives natively, which reduced architecture risk and improved maintainability.

### Q2. Are you using App Router?
- 30s: Yes, the app uses the app directory with layout and route page files.
- 90s: You can verify it in app/layout.tsx and app/page.tsx. Dynamic routing is also present in app/table/[tableId]/page.tsx.
- 3min: App Router is central in this codebase: root layout wraps providers, route files are colocated per path, dynamic segments are built-in, metadata is route-aware, and this supports cleaner modularity than legacy pages-only routing.

### Q3. Show file-based routing example.
- 30s: app/table/[tableId]/page.tsx maps to /table/:tableId.
- 90s: The bracket folder creates a dynamic segment. Next resolves params from URL and injects them into route logic.
- 3min: File-based routing removes manual route declarations, enforces convention, and keeps feature logic near route entry points. It also improves reviewability and onboarding.

### Q4. Is TypeScript strict mode enabled?
- 30s: Yes, strict mode is enabled.
- 90s: tsconfig has strict: true, noImplicitAny, and strictNullChecks.
- 3min: Strict typing catches bugs at compile time, especially around auth/session payloads and API contracts. It improves refactor confidence and test quality.

### Q5. Where is shared runtime config?
- 30s: In src/lib/config.ts.
- 90s: API base and feature toggles are centralized there to avoid hardcoded values in UI components.
- 3min: Central config prevents env drift, keeps deployment behavior predictable, and simplifies CI/prod troubleshooting.

## 2) Rendering and Architecture

### Q1. Server vs Client Components?
- 30s: Route files are server by default; interactive views are client components.
- 90s: app/page.tsx is server-first; CustomerPage and AppHeader are client due to hooks/events.
- 3min: We intentionally keep interactivity in client boundaries and avoid marking everything use client, preserving better architecture flexibility.

### Q2. Why use client here?
- 30s: Because it uses browser hooks and interaction handlers.
- 90s: Removing use client would break useState/useEffect/useRouter and DOM-dependent logic.
- 3min: We apply use client only where needed so hydration scope is constrained and component responsibility remains clear.

### Q3. Separation of server concerns and client interactivity?
- 30s: API/backend handles data and rules; UI handles interaction.
- 90s: Route handlers and Express routes enforce server logic; views/hooks handle user flows.
- 3min: This split reduces coupling, improves testability, and keeps business rules enforceable server-side regardless of client behavior.

### Q4. SSR/SSG/ISR usage?
- 30s: ISR is enabled on the home route.
- 90s: app/page.tsx sets revalidate.
- 3min: ISR balances freshness and performance by avoiding full rebuilds while keeping cached server output reasonably up to date.

### Q5. One flow to move server-side first?
- 30s: Initial menu read flow.
- 90s: It is read-heavy and suitable for server prefetch to improve first paint.
- 3min: Moving menu/category bootstrap server-side reduces startup fetch overhead and improves crawlability/perceived performance.

## 3) Data Fetching and Caching

### Q1. fetch, React Query, or both?
- 30s: Both.
- 90s: React Query for app data caching/mutations; fetch wrappers for low-level calls and route handlers.
- 3min: This hybrid gives robust cache control while keeping network utilities explicit and reusable.

### Q2. React Query setup and keys?
- 30s: QueryClientProvider globally + centralized queryKeys.
- 90s: useApiQueries.ts defines key constants and consistent invalidation paths.
- 3min: Stable keys are critical for predictable refetch behavior and avoiding stale or duplicate caches.

### Q3. Background refetching?
- 30s: refetchInterval on key queries.
- 90s: Orders/presence use intervals for near-real-time resilience.
- 3min: We combine polling fallback with event-driven updates to handle transport disruption gracefully.

### Q4. Mutation + invalidation example?
- 30s: add menu item invalidates menu query.
- 90s: onSuccess calls queryClient.invalidateQueries with relevant key.
- 3min: Mutation side-effects are centralized per hook, so UI components stay thin and state consistency is preserved.

### Q5. Optimistic update + rollback?
- 30s: cancel/delete order uses optimistic cache update and rollback on error.
- 90s: onMutate snapshots previous state, onError restores snapshot.
- 3min: This provides responsive UI while preserving correctness under failed requests.

### Q6. Why still useEffect fetching anywhere?
- 30s: Session validation and auth synchronization.
- 90s: These flows depend on runtime cookies/session state and periodic checks.
- 3min: It is justified for authentication lifecycle control where hooks must react to client visibility/focus and login state transitions.

## 4) State Management

### Q1. Why Context over Redux?
- 30s: Scope/complexity was moderate; Context + React Query was enough.
- 90s: Global state is split cleanly into auth and app contexts.
- 3min: Redux adds boilerplate and mental overhead; we would adopt it only when state complexity crosses a threshold.

### Q2. Provider tree and order?
- 30s: Query -> Auth -> App -> UI shell.
- 90s: Query first for cache availability, then auth/session, then app data consumption.
- 3min: Provider order ensures dependencies are available in lower layers and prevents circular context access patterns.

### Q3. What belongs in Context vs local state?
- 30s: Cross-page shared domain state in Context; UI transient state local.
- 90s: Session/menu/orders/settings are context; modal/input/selection are local.
- 3min: This keeps rerenders and ownership clear and avoids over-centralizing ephemeral state.

### Q4. When migrate to Redux?
- 30s: When global state interactions become too complex.
- 90s: Trigger points: high write contention, deeply nested updates, difficult traceability.
- 3min: I would migrate if feature velocity drops due to state coupling, and when devtools/time-travel debugging becomes a strong productivity need.

## 5) Authentication and Security

### Q1. Are you using JWT auth? Show file.
- 30s: Yes, JWT with role/table claims.
- 90s: Issuance and verification are in server middleware.
- 3min: We use JWT-based sessions for staff/customer with cookie transport and role-aware claims to enforce access model.

### Q2. Where issued and verified?
- 30s: issueToken issues; authenticate verifies.
- 90s: Both are in auth middleware.
- 3min: Verification occurs per request and feeds downstream authorization checks.

### Q3. Why HTTP-only cookies?
- 30s: Safer against token access via client JS.
- 90s: Cookies are sent automatically and can be configured secure/sameSite/httpOnly.
- 3min: This reduces XSS token theft risk compared to localStorage and centralizes session transport policy.

### Q4. Password storage?
- 30s: bcrypt hashing.
- 90s: Hash/verify helper functions are in middleware.
- 3min: Passwords are never stored plaintext; hash comparison defends against database leakage scenarios.

### Q5. Protected routes in Next?
- 30s: Via proxy matcher and permission checks.
- 90s: proxy.ts evaluates cookie permission and redirects unauthorized access.
- 3min: This adds a frontend navigation guard layer while backend still remains source of truth for authorization.

### Q6. Role model and enforcement?
- 30s: customer/kitchen/manager/admin with policy rules.
- 90s: Enforced by requireRole/requireTable and route policy helpers.
- 3min: We enforce least privilege and explicit role-path constraints to prevent accidental privilege escalation.

### Q7. PIN randomization behavior?
- 30s: Active customer sessions are invalidated.
- 90s: pinVersion mismatch triggers 401 and cookie/session clear.
- 3min: This ensures manager PIN resets force re-auth immediately and prevent stale-session abuse.

### Q8. Stale session invalidation?
- 30s: Polling + server snapshot checks + cache invalidation.
- 90s: Auth context reconciles local state with session endpoint and logs out when invalid.
- 3min: This design handles role drift, reset events, and transport issues with robust fallback logic.

## 6) API and Backend Integration

### Q1. Next API routes, backend routes, or both?
- 30s: Both.
- 90s: app/api route handlers + Express business endpoints.
- 3min: This hybrid lets us expose Next-native endpoints while keeping existing backend domain routes and Prisma logic.

### Q2. Show one CRUD flow end-to-end.
- 30s: Menu create: UI api call -> menu route -> prisma create.
- 90s: api.ts calls /api/menu, backend route validates payload, Prisma writes DB.
- 3min: The flow is layered: component action -> query hook/mutation -> API client -> backend route -> ORM -> response -> cache invalidation.

### Q3. Input validation?
- 30s: At route level.
- 90s: Required fields and constraints checked before DB ops.
- 3min: Validation is server-side first to preserve integrity regardless of client behavior.

### Q4. Clean error handling?
- 30s: Yes, normalized errors in client and JSON errors in server.
- 90s: requestJson wraps fetch errors; routes return status + error payload.
- 3min: This gives consistent UX messaging and easier debugging.

### Q5. API logic separated from UI?
- 30s: Yes, strict separation.
- 90s: src/lib/api + hooks contain network logic; components call actions.
- 3min: This architecture improves testability and supports future transport changes with minimal UI impact.

## 7) ORM and Database

### Q1. Prisma usage proof?
- 30s: Schema + client singleton + route queries.
- 90s: server/prisma/schema + server/src/db/prisma + server routes.
- 3min: Prisma models map domain entities; centralized client powers type-safe DB access.

### Q2. One relation explained.
- 30s: Order belongs to table and has many order items.
- 90s: This drives table order tracking and itemized kitchen workflow.
- 3min: The relation structure directly models restaurant flow and supports status transitions plus analytics.

### Q3. Why singleton/proxy prisma client?
- 30s: Prevent duplicate instances.
- 90s: Lazy init and centralized lifecycle.
- 3min: It reduces connection overhead and keeps access pattern consistent across modules.

### Q4. Dev schema sync process?
- 30s: prisma generate + db push flow.
- 90s: Build/postinstall includes Prisma generate.
- 3min: This ensures client type generation remains aligned with schema evolution.

## 8) Performance and React Patterns

### Q1. useMemo/useCallback/useRef examples + why?
- 30s: Memoized derived data, stable handlers, mutable refs for latest values.
- 90s: AppContext uses all three to control rerenders and avoid stale closures.
- 3min: These patterns are applied intentionally around heavy shared state and callback-rich components.

### Q2. Prevent unnecessary rerenders?
- 30s: Memoization + stable callbacks + query cache discipline.
- 90s: Context value memoization and stable action references are key.
- 3min: We keep state ownership clear and avoid recreating derived objects/functions unless dependencies change.

### Q3. React.memo usage?
- 30s: Not currently.
- 90s: We prioritized correctness and clear architecture first; memo can be added after profiling.
- 3min: I would add React.memo only where profiling shows expensive pure rerenders, to avoid premature complexity.

### Q4. Example stale-closure/loop risk avoided?
- 30s: refs in AppContext keep latest values in callbacks.
- 90s: useRef pattern avoids callback dependency churn while preserving correct reads.
- 3min: This design avoids stale captured state and keeps callback signatures stable for child consumers.

## 9) Styling, UX, Responsiveness

### Q1. Styling system and why?
- 30s: Tailwind + global CSS utilities.
- 90s: Fast composition, consistent spacing/typography, and custom animation support.
- 3min: It scales well with component-driven development and keeps style tokens centralized.

### Q2. Responsive breakpoints examples?
- 30s: sm variants in header, menu layout, table grid.
- 90s: Mobile-first classes adjust spacing, text size, and visibility by breakpoint.
- 3min: Breakpoint strategy prioritizes small screens while preserving desktop density and operability.

### Q3. Animation choices?
- 30s: Framer Motion for transitions, CSS keyframes for persistent visual states.
- 90s: Entrance animations and presence waves improve affordance without overwhelming UX.
- 3min: We selected lightweight, meaningful animations tied to state (table in-use, section load) rather than decorative noise.

### Q4. One mobile readability/accessibility decision?
- 30s: Larger tap targets and compact but readable action buttons.
- 90s: Header/action controls use mobile-friendly sizing and truncation handling.
- 3min: The interface balances information density with ergonomics by tuning spacing and typography per breakpoint.

## 10) SEO and Web Performance

### Q1. Global/per-page metadata?
- 30s: Global in root layout; per-page in route files.
- 90s: Includes dynamic metadata for table route.
- 3min: Metadata strategy supports both consistent branding and route-level relevance for search/social previews.

### Q2. OG/Twitter/JSON-LD?
- 30s: Yes, implemented.
- 90s: Layout defines Open Graph, Twitter card, and JSON-LD schema.
- 3min: Structured data improves machine readability, while OG/Twitter metadata improves social sharing quality.

### Q3. robots and sitemap?
- 30s: Yes, both present.
- 90s: public/robots.txt and app/sitemap.ts.
- 3min: Together they improve crawl control and discoverability hygiene.

### Q4. Core Web Vitals reporting?
- 30s: Collected with next/web-vitals and sent to API endpoint.
- 90s: WebVitalsReporter publishes metrics via sendBeacon/fetch.
- 3min: This telemetry enables production monitoring of LCP/CLS/FID/INP trends and regression detection.

### Q5. next/image usage and plan?
- 30s: Not fully adopted yet.
- 90s: Plan is to migrate relevant image assets to next/image and modern formats.
- 3min: We will prioritize large/critical images first, then validate gains via Lighthouse and web-vitals metrics.

## 11) Testing and Reliability

### Q1. Jest config rationale?
- 30s: ts-jest + jsdom for TypeScript React tests.
- 90s: It supports component rendering and DOM interaction assertions.
- 3min: Config balances frontend test ergonomics with TypeScript compatibility and deterministic setup.

### Q2. Testing-library utilities used?
- 30s: render, screen, fireEvent, waitFor, act.
- 90s: These cover static rendering, interaction, and async state transitions.
- 3min: Utility choice reflects user-centric testing philosophy with pragmatic async control.

### Q3. One test each: component/auth/api?
- 30s: components.test, auth-session-enforcement.test, api.test.
- 90s: They validate UI behavior, session correctness, and API client contracts.
- 3min: This triangulation catches regressions across presentation, state/security, and transport layers.

### Q4. Regression safety after refactors?
- 30s: Run targeted + full suites and preserve critical behavior tests.
- 90s: Known bug scenarios have dedicated regression tests.
- 3min: Refactor policy is test-first verification, then full-suite confirmation before accepting changes.

### Q5. Least-tested behavior currently?
- 30s: Full browser E2E flows.
- 90s: Unit/integration coverage is strong, but E2E could be expanded.
- 3min: Next step is Playwright for critical paths like login/order/pin-reset flows.

## 12) Deployment and Production Readiness

### Q1. Deployment config?
- 30s: Vercel config exists.
- 90s: vercel.json defines framework and build/install commands.
- 3min: Deployment setup aligns with Next + server dependencies and Prisma generation.

### Q2. Environment variables handling?
- 30s: Centralized in config and server route helpers.
- 90s: Public env only for client-safe values; secrets remain server-side.
- 3min: This separation avoids accidental client exposure and supports multi-environment portability.

### Q3. No secrets in frontend guarantee?
- 30s: Secrets are server-only, not exported to client modules.
- 90s: JWT secret is read server-side; client reads only public variables.
- 3min: Bundle hygiene + review of env naming conventions ensures secret boundaries remain intact.

### Q4. Backend-down behavior?
- 30s: Route handlers return 502/error JSON; UI surfaces errors.
- 90s: API wrappers normalize error feedback to user toasts/messages.
- 3min: Degradation is graceful: explicit error reporting without crashing app state.

### Q5. Go-live checklist?
- 30s: lint, tests, build, env verification, smoke tests.
- 90s: Include auth, ordering, permissions, and SEO endpoint checks.
- 3min: Release checklist covers quality gates, secrets/config audit, DB alignment, and post-deploy monitoring.

## 13) Deep-Dive Challenge Answers

### Q1. Remove React Query: what breaks and fallback?
- 30s: Cache/invalidation and mutation orchestration break first.
- 90s: We would replace with manual hook state + wrapper cache + explicit polling.
- 3min: Fallback is feasible but increases boilerplate and bug surface; React Query is justified by this complexity reduction.

### Q2. Manager permission mismatch debug steps?
- 30s: Verify token/session, frontend sync, and route policy mapping.
- 90s: Reproduce with controlled account, inspect session endpoint, compare proxy and backend role checks.
- 3min: Debug path: auth cookie decode -> /auth/session response -> AuthContext reconciliation -> route-permission helper -> backend requireRole -> targeted regression tests.

### Q3. SEO ranking drop: first files to inspect?
- 30s: layout metadata, sitemap, robots.
- 90s: Also inspect dynamic page metadata and canonical settings.
- 3min: I would audit metadata completeness, crawl directives, sitemap freshness, structured data validity, and deployment regressions.

### Q4. API latency doubles: what absorbs impact?
- 30s: Query caching, optimistic updates, polling strategy.
- 90s: React Query stale/cache behavior and graceful error handling reduce UX impact.
- 3min: System resilience comes from layered fetch strategy: cache-first UI continuity, controlled refetch cadence, and fallback toasts/state without catastrophic render blocking.

### Q5. One-week improvement plan: top 3 changes?
- 30s: next/image adoption, E2E tests, more server-side data prefetch.
- 90s: These improve performance, confidence, and architecture alignment.
- 3min: Priority order: performance wins (image pipeline), reliability (Playwright critical journeys), then rendering optimization (move read-heavy flows server-side) to improve SEO and startup UX.
