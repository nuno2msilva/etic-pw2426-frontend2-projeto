# Requirements Rubric Checklist

Use this as a grading sheet. Mark each item in Pass/Partial/Fail and add comments if needed.

## Core Requirements

| # | Requirement | Pass | Partial | Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| 1 | Next.JS | ☐ | ☐ | ☐ | [app/layout.tsx](app/layout.tsx#L7), [next.config.ts](next.config.ts#L3), [pages/api/[...path].ts](pages/api/[...path].ts#L1) | App Router layout + Next config + API bridge |
| 2 | Typescript | ☐ | ☐ | ☐ | [tsconfig.json](tsconfig.json#L2), [tsconfig.json](tsconfig.json#L16), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L21) | Strict TS config and typed app code |
| 3 | Hooks (useState & useEffect) | ☐ | ☐ | ☐ | [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L5), [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L37), [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L54), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L90) | Multiple state/effect flows |
| 4 | Styling (CSS, Tailwind or StyledComponents) | ☐ | ☐ | ☐ | [src/index.css](src/index.css#L12), [src/index.css](src/index.css#L14), [src/components/app/MenuOrderingView.tsx](src/components/app/MenuOrderingView.tsx#L43), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L106) | Tailwind + global CSS + custom styles |
| 5 | Authentication | ☐ | ☐ | ☐ | [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L311), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L83), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L178), [server/src/middleware/auth.ts](server/src/middleware/auth.ts#L255) | JWT cookies + role/table guards |
| 6 | SEO | ☐ | ☐ | ☐ | [app/layout.tsx](app/layout.tsx#L7), [app/layout.tsx](app/layout.tsx#L23), [app/layout.tsx](app/layout.tsx#L35), [app/layout.tsx](app/layout.tsx#L62) | Metadata, OG/Twitter, JSON-LD |
| 7 | API CRUD Operations (Fetch or Axios) | ☐ | ☐ | ☐ | [src/lib/api.ts](src/lib/api.ts#L16), [src/lib/api.ts](src/lib/api.ts#L60), [src/lib/api.ts](src/lib/api.ts#L73), [src/lib/api.ts](src/lib/api.ts#L107), [src/lib/api.ts](src/lib/api.ts#L140), [server/src/routes/menu.ts](server/src/routes/menu.ts#L19), [server/src/routes/menu.ts](server/src/routes/menu.ts#L57), [server/src/routes/menu.ts](server/src/routes/menu.ts#L98), [server/src/routes/menu.ts](server/src/routes/menu.ts#L138), [server/src/routes/menu.ts](server/src/routes/menu.ts#L170) | Frontend fetch client + backend CRUD endpoints |
| 8 | Navigation | ☐ | ☐ | ☐ | [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L5), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L93), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L104), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L117) | Next Link/router navigation |
| 9 | Responsive | ☐ | ☐ | ☐ | [src/components/app/MenuOrderingView.tsx](src/components/app/MenuOrderingView.tsx#L43), [src/components/app/MenuOrderingView.tsx](src/components/app/MenuOrderingView.tsx#L47), [src/components/app/AppHeader.tsx](src/components/app/AppHeader.tsx#L106), [src/components/app/TableSelector.tsx](src/components/app/TableSelector.tsx#L62) | Responsive classes across views/components |

## Bonus

| # | Bonus Requirement | Pass | Partial | Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| B1 | Unit testing | ☐ | ☐ | ☐ | [jest.config.cjs](jest.config.cjs#L3), [src/test/api.test.ts](src/test/api.test.ts#L55), [src/test/components.test.tsx](src/test/components.test.tsx#L1), [src/test/auth-session-enforcement.test.tsx](src/test/auth-session-enforcement.test.tsx#L1) | Jest + ts-jest + broad suites |
| B2 | ContextAPI or Redux | ☐ | ☐ | ☐ | [src/context/AppContext.tsx](src/context/AppContext.tsx#L84), [src/context/AppContext.tsx](src/context/AppContext.tsx#L94), [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L66), [app/providers.tsx](app/providers.tsx#L34) | Context API providers and hooks |
| B3 | Animations | ☐ | ☐ | ☐ | [src/components/app/TableSelector.tsx](src/components/app/TableSelector.tsx#L3), [src/components/app/TableSelector.tsx](src/components/app/TableSelector.tsx#L28), [src/index.css](src/index.css#L140), [src/index.css](src/index.css#L172) | Framer Motion + CSS keyframes |
| B4 | React Query | ☐ | ☐ | ☐ | [app/providers.tsx](app/providers.tsx#L5), [app/providers.tsx](app/providers.tsx#L31), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L22), [src/hooks/useApiQueries.ts](src/hooks/useApiQueries.ts#L34), [src/hooks/useTablePresence.ts](src/hooks/useTablePresence.ts#L5) | QueryClient + useQuery/useMutation |
| B5 | useMemo, useCallback & useRef | ☐ | ☐ | ☐ | [src/context/AppContext.tsx](src/context/AppContext.tsx#L128), [src/context/AppContext.tsx](src/context/AppContext.tsx#L137), [src/context/AppContext.tsx](src/context/AppContext.tsx#L153), [src/views/CustomerPage.tsx](src/views/CustomerPage.tsx#L29) | Memoization + refs + stable callbacks |
| B6 | Prisma | ☐ | ☐ | ☐ | [server/prisma/schema.prisma](server/prisma/schema.prisma#L4), [server/prisma/schema.prisma](server/prisma/schema.prisma#L8), [server/prisma/schema.prisma](server/prisma/schema.prisma#L31), [server/src/db/prisma.ts](server/src/db/prisma.ts#L3), [server/src/db/prisma.ts](server/src/db/prisma.ts#L14) | Prisma schema and runtime client |

## Scoring Summary (optional)

- Core passed: ___ / 9
- Bonus passed: ___ / 6
- Overall comments:
