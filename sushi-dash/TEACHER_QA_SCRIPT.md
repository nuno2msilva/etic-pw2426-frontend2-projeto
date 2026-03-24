# Teacher Interview Script: Questions + Model Answers

This script answers the question bank in [TEACHER_EXPECTED_QUESTIONS.md](TEACHER_EXPECTED_QUESTIONS.md).

## 1) Core Stack and Project Structure

1. Why did you choose Next.js instead of Vite/CRA for this project?
   Answer: We needed built-in routing, metadata/SEO support, server rendering options, and easy deployment on Vercel. Next.js gave us those features natively without assembling many extra tools.

2. Are you using the App Router? Show me where this is clear in your project structure.
   Answer: Yes. The app uses the app directory with route files and a root layout.
   Show file: [app/layout.tsx](app/layout.tsx), [app/page.tsx](app/page.tsx), [app/table/[tableId]/page.tsx](app/table/[tableId]/page.tsx)

3. Can you show one page route in the app directory and explain how file-based routing works?
   Answer: For example, [app/table/[tableId]/page.tsx](app/table/[tableId]/page.tsx) maps to /table/:tableId automatically. The folder/file name defines the route.

4. Is your project in TypeScript strict mode? Which tsconfig options prove it?
   Answer: Yes. strict is enabled, with noImplicitAny and strictNullChecks.
   Show file: [tsconfig.json](tsconfig.json#L16), [tsconfig.json](tsconfig.json#L17), [tsconfig.json](tsconfig.json#L20)

5. Where do you keep shared runtime config, and why?
   Answer: In a central config module so environment logic is not duplicated across components.
   Show file: [src/lib/config.ts](src/lib/config.ts)

## 2) Rendering and Architecture

1. Which parts of your app are Server Components and which are Client Components?
   Answer: Route files under app are Server Components by default. Interactive views/components are Client Components with use client.
   Show file: [app/page.tsx](app/page.tsx), [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L3)

2. Why is this component marked with use client? What would break if you removed it?
   Answer: Components like customer page/header use hooks, browser APIs, and event handlers. Removing use client would break useState/useEffect/useRouter and interactivity.
   Show file: [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L3), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L3)

3. Where do you separate server-side concerns from client-side interactivity?
   Answer: Server concerns are in API routes and backend routes. Client interactivity stays in views/components and hooks.
   Show file: [app/api/v1/menu/route.ts](app/api/v1/menu/route.ts), [server/src/routes/menu.ts](server/src/routes/menu.ts), [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx)

4. Are you using SSR, SSG, or ISR anywhere? Show me the file and line that proves it.
   Answer: We use ISR on the home route.
   Show file: [app/page.tsx](app/page.tsx#L8)

5. If I ask you to move one data flow from client fetching to server fetching, which one would you pick first and why?
   Answer: Menu read data on first load would be my first target because it is read-heavy and public-facing. Server-side prefetch would improve first paint and reduce client fetch churn.

## 3) Data Fetching and Caching

1. Are you using plain fetch, React Query, or both? Explain where each is used.
   Answer: Both. React Query handles most app data (queries/mutations/cache). Plain fetch is used in wrappers and special flows like auth/session checks and route handlers.
   Show file: [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts), [src/lib/api.ts](src/lib/api.ts), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L112)

2. Show me your React Query setup and explain cache keys.
   Answer: QueryClient is provided globally and keys are centralized in queryKeys to keep invalidation consistent.
   Show file: [app/providers.tsx](app/providers.tsx#L31), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L9)

3. How do you handle background refetching?
   Answer: We use refetchInterval for resilience and near-real-time updates.
   Show file: [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L27), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L176), [src/hooks/useTablePresence.ts](src/hooks/useTablePresence.ts#L16)

4. Show me one mutation and explain how cache invalidation is done after success.
   Answer: Example: add menu item mutation invalidates the menu query key on success.
   Show file: [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L34), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L38)

5. Give an example of optimistic update in your code and explain rollback behavior on error.
   Answer: Cancel/delete order uses optimistic cache updates in onMutate, keeps previous snapshot, and restores snapshot in onError.
   Show file: [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L213), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L221), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L241)

6. Where are you still using useEffect-based fetching and why is that justified?
   Answer: Session validation in auth/customer flows uses effect-based fetch because it depends on runtime session/cookie state and polling cadence.
   Show file: [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L81), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L209), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L274)

## 4) State Management

1. Why did you choose Context API instead of Redux Toolkit for this project?
   Answer: The domain state is moderate and naturally grouped (auth + app data). Context + React Query kept complexity lower while still scalable for this scope.

2. Show me your global providers tree and explain the provider order.
   Answer: QueryClientProvider wraps the app for caching, then auth/app providers, then live SSE updates and layout shell.
   Show file: [app/providers.tsx](app/providers.tsx)

3. What state belongs in Context and what stays local component state?
   Answer: Shared cross-page data (auth session, menu/tables/orders/settings actions) is in Context. UI-only state (modal open, selected item, form field) stays local.
   Show file: [src/context/AppContext.tsx](src/context/AppContext.tsx), [src/context/AuthContext.tsx](src/context/AuthContext.tsx), [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L37)

4. If this project doubled in complexity, when would you migrate to Redux?
   Answer: I would migrate when cross-cutting client-only state becomes highly normalized, many disconnected components write to the same state, and debugging time-travel tooling becomes valuable.

## 5) Authentication and Security

1. What are you using for authentication? Are you using JWT? Can you show me the file?
   Answer: Yes, JWT-based auth. Staff and customer sessions are JWT tokens with role/table claims.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L24), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L83)

2. Where are JWTs issued and verified?
   Answer: Issued in issueToken and verified in authenticate middleware.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L83), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L114)

3. How are tokens stored? Why are HTTP-only cookies safer than localStorage for auth tokens?
   Answer: Stored in HTTP-only cookies. This reduces direct token access from injected client-side scripts and supports secure cookie policies.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L90)

4. How are passwords stored? Show where hashing is done.
   Answer: Passwords are bcrypt-hashed.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L70)

5. How do you protect routes in Next.js? Show your middleware/proxy matcher.
   Answer: A Next proxy guard checks staff permission against path policy and redirects unauthorized access.
   Show file: [proxy.ts](proxy.ts#L43), [proxy.ts](proxy.ts#L55)

6. Explain your role model (customer/kitchen/manager/admin). Where is authorization enforced?
   Answer: Customer is table-scoped; staff roles are hierarchical with explicit policy. Authorization is enforced in backend requireRole/requireTable and frontend route guards.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L178), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L255), [src/lib/route-permissions.ts](src/lib/route-permissions.ts)

7. What happens when a table PIN is randomized while a customer is active?
   Answer: pinVersion mismatch invalidates customer session, cookies are cleared, and the client is ejected/re-auth required.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L278), [server/src/routes/orders.ts](server/src/routes/orders.ts#L193), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L274)

8. How do you invalidate stale sessions?
   Answer: Polling/session checks compare server state, then clear local sessions and invalidate query caches.
   Show file: [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L209), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L274), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L98)

## 6) API and Backend Integration

1. Do you have Next API routes, backend routes, or both? Why this architecture?
   Answer: Both. Next route handlers provide app-integrated endpoints and proxy-style wrappers; Express handles full business routes and Prisma integration.
   Show file: [app/api/v1/menu/route.ts](app/api/v1/menu/route.ts), [server/src/routes/menu.ts](server/src/routes/menu.ts)

2. Show me one full CRUD flow (for menu, table, or order): frontend call -> endpoint -> DB.
   Answer: Menu example: UI calls api client create/update/delete -> backend route menu.ts endpoint -> Prisma item create/update.
   Show file: [src/lib/api.ts](src/lib/api.ts#L73), [server/src/routes/menu.ts](server/src/routes/menu.ts#L57), [server/src/routes/menu.ts](server/src/routes/menu.ts#L112)

3. Where do you do input validation for API payloads?
   Answer: Validation is done at route level before DB operations.
   Show file: [server/src/routes/menu.ts](server/src/routes/menu.ts#L66), [app/api/v1/web-vitals/route.ts](app/api/v1/web-vitals/route.ts#L11)

4. Show one place where errors are normalized and returned cleanly to the UI.
   Answer: requestJson throws normalized fallback errors; route handlers return consistent JSON errors/status.
   Show file: [src/lib/api.ts](src/lib/api.ts#L10), [server/src/routes/menu.ts](server/src/routes/menu.ts#L51)

5. How do you keep API logic separate from UI components?
   Answer: API calls live in src/lib/api and hooks in useApiQueries, while components consume those hooks/context actions.
   Show file: [src/lib/api.ts](src/lib/api.ts), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts), [src/components/app/MenuOrderingView.tsx](src/components/app/MenuOrderingView.tsx)

## 7) ORM and Database

1. Are you using Prisma? Show schema, client init, and one query usage.
   Answer: Yes. Schema is in server/prisma, client singleton is in server/src/db/prisma.ts, and queries are in route files.
   Show file: [server/prisma/schema.prisma](server/prisma/schema.prisma), [server/src/db/prisma.ts](server/src/db/prisma.ts), [server/src/routes/menu.ts](server/src/routes/menu.ts#L24)

2. Explain one model relation from your schema and how it maps to features.
   Answer: Order has many OrderItem and belongs to TableConfig; this maps directly to table-specific live order queues and itemized kitchen workflow.
   Show file: [server/prisma/schema.prisma](server/prisma/schema.prisma#L112), [server/prisma/schema.prisma](server/prisma/schema.prisma#L127)

3. Why use a Prisma singleton/client proxy pattern on the server?
   Answer: It avoids multiple client initializations and keeps DB access centralized/lazy.
   Show file: [server/src/db/prisma.ts](server/src/db/prisma.ts#L8), [server/src/db/prisma.ts](server/src/db/prisma.ts#L20)

4. What migrations or schema sync process are you using in development?
   Answer: We use Prisma schema management and db push/generate scripts for development sync.
   Show file: [package.json](package.json#L9), [package.json](package.json#L10)

## 8) Performance and React Patterns

1. Show me examples of useMemo, useCallback, and useRef, and justify each usage.
   Answer: useMemo is used for derived data and stable context values, useCallback for stable handlers, and useRef for mutable latest values without re-render.
   Show file: [src/context/AppContext.tsx](src/context/AppContext.tsx#L128), [src/context/AppContext.tsx](src/context/AppContext.tsx#L153), [src/context/AppContext.tsx](src/context/AppContext.tsx#L137)

2. How did you prevent unnecessary re-renders in heavy components?
   Answer: Stable callbacks, memoized derived data, and centralized query cache updates reduce churn in consumer components.
   Show file: [src/context/AppContext.tsx](src/context/AppContext.tsx#L326), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L9)

3. Are you using React.memo? If not, why not yet, and where would you consider adding it?
   Answer: Not currently. I would add it to pure, frequently re-rendered visual components such as list cards or grid items when profiling shows prop-stable rerenders.

4. Can you point to one place you avoided a render loop or stale-closure bug?
   Answer: App context stores latest menu/settings/orders in refs to avoid stale closure in callbacks while keeping dependencies clean.
   Show file: [src/context/AppContext.tsx](src/context/AppContext.tsx#L136)

## 9) Styling, UX, and Responsiveness

1. Which styling system are you using and why?
   Answer: Tailwind + global CSS utilities. It is fast for component composition and still allows custom keyframes/themes.
   Show file: [src/index.css](src/index.css#L12), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L106)

2. Show me responsive breakpoints in real components (mobile + desktop behavior).
   Answer: Components use sm breakpoints for layout, sizing, and visibility behavior.
   Show file: [src/components/app/MenuOrderingView.tsx](src/components/app/MenuOrderingView.tsx#L43), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L111)

3. Where did you implement animations, and why did you choose those interactions?
   Answer: Framer Motion is used for entrance transitions, and CSS keyframes for persistent visual states like table presence pulse.
   Show file: [src/components/app/TableSelector.tsx](src/components/app/TableSelector.tsx#L28), [src/index.css](src/index.css#L140)

4. Show one UI decision you made for accessibility or readability on mobile.
   Answer: Mobile-friendly button sizing and condensed headers improve tap targets and readability.
   Show file: [src/components/app/MenuOrderingView.tsx](src/components/app/MenuOrderingView.tsx#L53), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L160)

## 10) SEO and Web Performance

1. Show me where title/description metadata are defined globally and per-page.
   Answer: Global metadata is in root layout; per-page metadata exists in route files and dynamic metadata in table route.
   Show file: [app/layout.tsx](app/layout.tsx#L7), [app/page.tsx](app/page.tsx#L10), [app/table/[tableId]/page.tsx](app/table/[tableId]/page.tsx#L13)

2. Do you have Open Graph/Twitter metadata and structured data (JSON-LD)?
   Answer: Yes, all are defined in layout metadata and head script.
   Show file: [app/layout.tsx](app/layout.tsx#L23), [app/layout.tsx](app/layout.tsx#L35), [app/layout.tsx](app/layout.tsx#L62)

3. Do you provide robots.txt and sitemap.xml? Show the files.
   Answer: Yes.
   Show file: [public/robots.txt](public/robots.txt), [app/sitemap.ts](app/sitemap.ts)

4. How are Core Web Vitals being measured or reported in your app?
   Answer: next/web-vitals reports metrics and sends payload to an API endpoint.
   Show file: [src/components/app/WebVitalsReporter.tsx](src/components/app/WebVitalsReporter.tsx#L3), [app/api/v1/web-vitals/route.ts](app/api/v1/web-vitals/route.ts#L20)

5. Are images optimized with next/image or modern formats? If not, what is your plan?
   Answer: next/image is not currently used. Plan: migrate key images to next/image, provide WebP/AVIF assets, and validate Lighthouse improvements in LCP.

## 11) Testing and Reliability

1. Show your Jest config and explain test environment choices.
   Answer: Jest uses ts-jest and jsdom because this is a React UI-heavy app with TypeScript tests.
   Show file: [jest.config.cjs](jest.config.cjs#L3), [jest.config.cjs](jest.config.cjs#L4)

2. Which testing-library utilities are you using for user interaction tests?
   Answer: render, screen, fireEvent, waitFor, and act where timing or async behavior is involved.
   Show file: [src/test/components.test.tsx](src/test/components.test.tsx#L3), [src/test/auth-session-enforcement.test.tsx](src/test/auth-session-enforcement.test.tsx#L1)

3. Demonstrate one component test, one auth/session test, and one API-layer test.
   Answer: Component behavior is covered in components.test, auth session enforcement in auth-session-enforcement.test, and API client behavior in api.test.
   Show file: [src/test/components.test.tsx](src/test/components.test.tsx#L27), [src/test/auth-session-enforcement.test.tsx](src/test/auth-session-enforcement.test.tsx#L91), [src/test/api.test.ts](src/test/api.test.ts#L55)

4. How do you ensure regressions are caught after refactors?
   Answer: We keep broad coverage (API/auth/components/behavior) and run full suite after refactors, with specific regression tests for previously broken scenarios.

5. Which important behavior is currently least tested and why?
   Answer: End-to-end real browser flows (full network + UI) are less covered than unit/integration tests. Adding Playwright would close that gap.

## 12) Deployment and Production Readiness

1. Where is deployment configured (for example, Vercel)?
   Answer: Vercel config exists and build/install commands are defined.
   Show file: [vercel.json](vercel.json)

2. How are environment variables handled across local/dev/prod?
   Answer: Runtime URLs/secrets are read from env vars in both frontend config and backend middleware.
   Show file: [src/lib/config.ts](src/lib/config.ts#L4), [app/api/v1/health/route.ts](app/api/v1/health/route.ts#L4), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L26)

3. Show me how you guarantee no secrets are exposed in client bundles.
   Answer: Secrets stay server-side; client uses public-prefixed env only. JWT secret is read in server middleware and never exported to client code.
   Show file: [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L26), [src/lib/config.ts](src/lib/config.ts#L4)

4. If the backend is down, what user-facing behavior do you currently have?
   Answer: Route handlers return 502/JSON fallback errors and UI shows error toasts/messages from normalized error handling.
   Show file: [app/api/v1/health/route.ts](app/api/v1/health/route.ts#L19), [src/lib/api.ts](src/lib/api.ts#L16)

5. What is your go-live checklist before production release?
   Answer: Verify env vars, run lint/tests/build, validate SEO files/metadata, run DB schema generate/push/migrations, and smoke-test auth/order flows in production-like environment.

## 13) Deep-Dive Challenge Questions (Teacher follow-up)

1. If I remove React Query from your project, what breaks first and what is your fallback strategy?
   Answer: Cache/invalidation and mutation orchestration break first. Fallback would be custom hooks with centralized fetch wrapper, manual cache state, and explicit polling.

2. If a manager reports wrong permissions in UI but backend says correct, how would you debug it step-by-step?
   Answer:
   - Check decoded cookie/session payload and backend session endpoint response.
   - Inspect auth synchronization in frontend context.
   - Verify route policy mapping in proxy/permission helper.
   - Reproduce with tests around role drift and route access.
   Show file: [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L209), [proxy.ts](proxy.ts#L43), [src/lib/route-permissions.ts](src/lib/route-permissions.ts), [src/test/proxy-access-control.test.ts](src/test/proxy-access-control.test.ts)

3. If SEO rankings drop, which three files would you inspect first?
   Answer: Root metadata/layout, sitemap, and robots.
   Show file: [app/layout.tsx](app/layout.tsx), [app/sitemap.ts](app/sitemap.ts), [public/robots.txt](public/robots.txt)

4. If API latency doubles, which parts of your architecture help absorb the impact?
   Answer: React Query caching/stale policies, refetch intervals, optimistic updates, and graceful error wrappers reduce user-visible impact.
   Show file: [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L22), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L213), [src/lib/api.ts](src/lib/api.ts#L10)

5. If you had one week to improve this project, what three technical improvements would you implement first and why?
   Answer:
   - Introduce next/image for media optimization and better LCP.
   - Add end-to-end tests (Playwright) for auth and ordering critical paths.
   - Move selected read-heavy data fetches to server components for improved first render and SEO consistency.
