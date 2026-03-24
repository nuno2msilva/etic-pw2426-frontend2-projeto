# Teacher Interview Questions (Based on Both Checklists)

Use this as an oral-defense guide. The goal is to validate understanding, not only implementation.

## 1) Core Stack and Project Structure

1. Why did you choose Next.js instead of Vite/CRA for this project?
2. Are you using the App Router? Show me where this is clear in your project structure.
3. Can you show one page route in the app directory and explain how file-based routing works?
4. Is your project in TypeScript strict mode? Which tsconfig options prove it?
5. Where do you keep shared runtime config, and why?

## 2) Rendering and Architecture

1. Which parts of your app are Server Components and which are Client Components?
2. Why is this component marked with use client? What would break if you removed it?
3. Where do you separate server-side concerns from client-side interactivity?
4. Are you using SSR, SSG, or ISR anywhere? Show me the file and line that proves it.
5. If I ask you to move one data flow from client fetching to server fetching, which one would you pick first and why?

## 3) Data Fetching and Caching

1. Are you using plain fetch, React Query, or both? Explain where each is used.
2. Show me your React Query setup and explain cache keys.
3. How do you handle background refetching?
4. Show me one mutation and explain how cache invalidation is done after success.
5. Give an example of optimistic update in your code and explain rollback behavior on error.
6. Where are you still using useEffect-based fetching and why is that justified?

## 4) State Management

1. Why did you choose Context API instead of Redux Toolkit for this project?
2. Show me your global providers tree and explain the provider order.
3. What state belongs in Context and what stays local component state?
4. If this project doubled in complexity, when would you migrate to Redux?

## 5) Authentication and Security

1. What are you using for authentication? Are you using JWT? Can you show me the file?
2. Where are JWTs issued and verified?
3. How are tokens stored? Why are HTTP-only cookies safer than localStorage for auth tokens?
4. How are passwords stored? Show where hashing is done.
5. How do you protect routes in Next.js? Show your middleware/proxy matcher.
6. Explain your role model (customer/kitchen/manager/admin). Where is authorization enforced?
7. What happens when a table PIN is randomized while a customer is active?
8. How do you invalidate stale sessions?

## 6) API and Backend Integration

1. Do you have Next API routes, backend routes, or both? Why this architecture?
2. Show me one full CRUD flow (for menu, table, or order): frontend call -> endpoint -> DB.
3. Where do you do input validation for API payloads?
4. Show one place where errors are normalized and returned cleanly to the UI.
5. How do you keep API logic separate from UI components?

## 7) ORM and Database

1. Are you using Prisma? Show schema, client init, and one query usage.
2. Explain one model relation from your schema and how it maps to features.
3. Why use a Prisma singleton/client proxy pattern on the server?
4. What migrations or schema sync process are you using in development?

## 8) Performance and React Patterns

1. Show me examples of useMemo, useCallback, and useRef, and justify each usage.
2. How did you prevent unnecessary re-renders in heavy components?
3. Are you using React.memo? If not, why not yet, and where would you consider adding it?
4. Can you point to one place you avoided a render loop or stale-closure bug?

## 9) Styling, UX, and Responsiveness

1. Which styling system are you using and why?
2. Show me responsive breakpoints in real components (mobile + desktop behavior).
3. Where did you implement animations, and why did you choose those interactions?
4. Show one UI decision you made for accessibility or readability on mobile.

## 10) SEO and Web Performance

1. Show me where title/description metadata are defined globally and per-page.
2. Do you have Open Graph/Twitter metadata and structured data (JSON-LD)?
3. Do you provide robots.txt and sitemap.xml? Show the files.
4. How are Core Web Vitals being measured or reported in your app?
5. Are images optimized with next/image or modern formats? If not, what is your plan?

## 11) Testing and Reliability

1. Show your Jest config and explain test environment choices.
2. Which testing-library utilities are you using for user interaction tests?
3. Demonstrate one component test, one auth/session test, and one API-layer test.
4. How do you ensure regressions are caught after refactors?
5. Which important behavior is currently least tested and why?

## 12) Deployment and Production Readiness

1. Where is deployment configured (for example, Vercel)?
2. How are environment variables handled across local/dev/prod?
3. Show me how you guarantee no secrets are exposed in client bundles.
4. If the backend is down, what user-facing behavior do you currently have?
5. What is your go-live checklist before production release?

## 13) Deep-Dive Challenge Questions (Teacher follow-up)

1. If I remove React Query from your project, what breaks first and what is your fallback strategy?
2. If a manager reports wrong permissions in UI but backend says correct, how would you debug it step-by-step?
3. If SEO rankings drop, which three files would you inspect first?
4. If API latency doubles, which parts of your architecture help absorb the impact?
5. If you had one week to improve this project, what three technical improvements would you implement first and why?
