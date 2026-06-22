# TDD Instruction Guide
## How to Write Checklists That Produce Rock-Solid, Fully Wired Features

> **Who is this for?** Anyone — developer, product owner, or team lead — working on any software project. If you hand this guide to a complete beginner, they should be able to write a proper implementation checklist by the end of it.

> **Why does this exist?** Many teams discover "phantom features" — things that have green (passing) tests but are completely broken in the real, running application. The root cause is always poorly written checklists that allow lazy mocking and skipped integration. This guide exists to make that impossible.

---

## Part 1: The 5 Principles of a Great Checklist

### Principle 1: Always Start with "Root Cause" and End with "Verification Chain"

Every single checklist item must be **bookended** by these two things.

**Root Cause** answers: *Why does this problem exist, or why does this feature need to be built?*
It stops the developer (or AI) from guessing what to fix or build. Without it, they might fix the wrong thing, and the tests might still pass.

**Verification Chain** answers: *What does success look like from the user's perspective, end to end?*
It is not "tests pass." It is a human-readable sequence of events: *User does X → System does Y → User sees Z.*
If the feature doesn't achieve this exact chain, it is not done — no matter what the tests say.

> ❌ **Bad:** "Fix the navigation bug."
> ✅ **Good:**
> **Root cause:** `ProductGrid.tsx` renders product cards with an "Add" button but zero `<Link>` elements. A buyer can never navigate to a product's detail page.
> **Verification chain:** Product grid → user clicks card image → browser navigates to `/products/<id>` → `ProductDetailPage` renders with full variant list and "Add to cart."

---

### Principle 2: Demand a Confirmed RED State Before Any Code

This is the most important principle and the one most commonly skipped.

**The rule:** A test must be written first, run, and confirmed to be **failing (RED)** before any implementation code is written.

**Why?** If a test passes immediately after you write it (before writing the feature), it means the test is not actually testing reality. It is probably mocked incorrectly, or it is testing something that already works. A test that can't fail is worthless.

**How to write it:** Every test instruction must end with: *"Run — confirm RED."*

> ❌ **Bad:** "Write a test for idempotency and then implement it."
> ✅ **Good:**
> - [ ] **RED — Integration (`order.controller.test.ts`):**
>   - [ ] Test: Two `POST /api/v1/orders` requests with the same `X-Idempotency-Key` both return the same `orderId`.
>   - [ ] **Run — confirm RED (two separate orders are created today; the test will fail).**

The phrase "Run — confirm RED" is not optional decoration. It is a gate. You do not proceed to GREEN until you have seen the test fail.

---

### Principle 3: Always Require Both a Unit Test AND an Integration Test

This is exactly where the "phantom features" came from in Session 95. We had many passing unit tests, but the UI was not wired to the backend.

**Unit tests** prove that a single function or component works correctly in isolation.
**Integration tests** prove that the full system path — from HTTP request, through the router, through the service, into the database, and back — works correctly.

You need **both**. A unit test alone is never sufficient for a feature that spans the backend and frontend.

| Test Type | What It Proves | Is It Enough Alone? |
|---|---|---|
| Unit (component) test | The React component renders a `<Link>` tag | ❌ No. The backend might not serve the correct `productId`. |
| Integration test | `GET /api/v1/products` returns `productId` in its response | ❌ No. The frontend might not use it to build the link. |
| **Both together** | The full path from API → UI → correct navigation | ✅ Yes. |

---

### Principle 4: Separate the Tiers Explicitly (DB → Backend → Frontend)

A checklist that says "update the feature" is useless. A good checklist breaks the work into the architectural layers it touches.

The standard tiers in this project are:

1. **Schema / Migration:** Any change to `schema.prisma` requires a migration. Name it explicitly.
2. **Repository:** The database query layer. Does it need to return a new field or join a new table?
3. **Service:** The business logic layer. Does any rule or calculation need to change?
4. **Controller / Routes:** The HTTP layer. Is the new field being serialized into the response? Are auth guards correct?
5. **Frontend Type:** The TypeScript type that mirrors the API response. If the backend adds a field, the frontend type must be updated too.
6. **Frontend Component:** The React component. What exactly changes in the JSX?

By listing each tier, you make it impossible to skip a step. If the Repository returns a field but the Controller doesn't serialize it, the frontend will never see it.

---

### Principle 5: Write Hyper-Specific Assertions

The more vague an assertion is, the easier it is to pass with a bad implementation.

**The rule:** State *exactly* what the test should assert. Name the HTTP method, the URL, the specific field name, the specific value, and the specific database state.

> ❌ **Bad assertion:** "Test that the order is created correctly."
> ✅ **Good assertion:** "Test: Two `POST /api/v1/orders` calls with identical `X-Idempotency-Key: abc-123` both return the same `orderId`. After both calls, `SELECT COUNT(*) FROM orders WHERE user_id = ?` returns exactly `1`."

The good assertion is so specific that there is only *one* correct implementation. The bad assertion can be passed by almost any implementation.

---

## Part 2: The Template

Copy and fill this in for every checklist item you write. If a section is truly not applicable, write `N/A` and explain why. Do not leave sections blank.

```markdown
#### [Feature/Fix Name — Short and Specific]

**Root cause / Goal:**
[For a bug fix: Why does this bug exist? What code path is broken?]
[For a new feature: What user need does this solve? Why does it need to be built now?]

**Fix / Approach:**
[For a bug: Exactly what file(s) will be changed and how, at a high level.]
[For a feature: Describe the implementation approach at a high level before the checklist begins.]

---

- [ ] **RED — Integration (`exact-test-file-name.test.ts`):**
  - [ ] Test: [HTTP Method] `[/api/v1/exact-path]` with `[exact payload or headers]` returns `[exact response field and value]`.
  - [ ] Test: [Any additional assertions about DB state or side effects.]
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend (Schema → Repository → Service → Controller):**
  - [ ] [Schema] If schema changes are needed: add `[fieldName Type @default(value)]` to `[ModelName]` in `schema.prisma`. Run `pnpm --filter @gorola/api prisma migrate dev --name [descriptive-migration-name]`. Apply to test DB.
  - [ ] [Repository] Update `[methodName]` in `[repository-file.ts]` to [exactly what changes].
  - [ ] [Service] Update `[methodName]` in `[service-file.ts]` to [exactly what changes].
  - [ ] [Controller] Update `[serializer/handler]` in `[controller-file.ts]` to expose `[fieldName]` in the response.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit / Component (`exact-component-file.test.tsx`):**
  - [ ] Test: [Exact user interaction: "clicking the X button"] results in [exact expected outcome: "calls `navigate('/correct/path')`"].
  - [ ] Test: [Any edge case or negative assertion].
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Component):**
  - [ ] [Types] Add `[fieldName: type]` to the `[TypeName]` type in `[component-or-api-file.ts]`.
  - [ ] [Component] In `[Component.tsx]`, [exactly what JSX or logic changes].
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] [User action] → [System behavior] → [What user sees/experiences].
```

---

## Part 3: The Self-Check Rubric

Before you submit a checklist for implementation, run it through this rubric. If you can't answer YES to every question, the checklist is not ready.

| # | Question | Why It Matters |
|---|---|---|
| 1 | Does every item have a **Root Cause** or **Goal**? | Without it, the wrong thing gets fixed or built. |
| 2 | Does every test instruction end with **"Run — confirm RED"**? | Without it, tests are written but never actually run to failure. |
| 3 | Is there **at least one integration test** that hits a real HTTP route? | Without it, phantom features exist — tests pass but the app is broken. |
| 4 | Is there **at least one unit/component test** that tests the frontend in isolation? | Without it, the UI wiring is never verified. |
| 5 | Are all tiers listed explicitly (Schema, Repo, Service, Controller, Frontend Type, Component)? | Without it, a tier gets skipped and the data never flows end-to-end. |
| 6 | Are assertions **hyper-specific** (exact URLs, exact field names, exact expected DB state)? | Without it, a flawed implementation can still pass the test. |
| 7 | Does every item end with a **Verification Chain** in plain English? | Without it, "done" is defined by tests, not by whether the user's experience is correct. |

---

## Part 4: Example A — A Bug Fix

**The Bug:** The `SearchResultsPage` navigates to `/search?q=Dairy` when a user clicks the "Dairy" subcategory result. It should navigate to `/categories/groceries/dairy`. The search API also doesn't return the `categorySlug` needed to build the correct URL.

> ✅ **Check this example against the rubric:**
> 1. Root Cause? ✅
> 2. "Run — confirm RED"? ✅
> 3. Integration test on real HTTP route? ✅ (`GET /api/v1/search?q=<term>`)
> 4. Unit/component test? ✅ (`SearchResultsPage.test.tsx`)
> 5. All tiers listed? ✅ (Repository, Controller, Frontend Type, Component)
> 6. Hyper-specific assertions? ✅ (exact URL `/categories/groceries/dairy`, exact field `categorySlug`)
> 7. Verification Chain? ✅
>
> **Verdict: GREAT CHECKLIST ✅**

```markdown
#### W-012 — Subcategory Click in Search Results Uses Wrong Route

**Root cause:**
`SearchResultsPage.tsx` line 141 calls `navigate('/search?q=${sub.name}')` when a
subcategory result is clicked. This navigates back to the search page with the
subcategory name as the query term instead of going to the correct subcategory page.
The search API's subcategory results do not include the `categorySlug` field, so the
correct URL `/categories/:categorySlug/:subSlug` cannot even be constructed on the
frontend.

**Fix:** Update `SearchRepository` to join the parent `Category` on subcategory
results. Update `SearchController` to include `categorySlug` in the serialized
response. Update `SearchResultsPage` to use the new field for navigation.

---

- [ ] **RED — Integration (`search.controller.test.ts`):**
  - [ ] Test: `GET /api/v1/search?q=dairy` returns subcategory items where each item
    includes BOTH a `slug` field AND a `categorySlug` field.
  - [ ] Test: The `categorySlug` value matches the parent category's slug
    (e.g., `"groceries"`, not `null` or `undefined`).
  - [ ] **Run — confirm RED (the `categorySlug` field is absent from the current response).**

- [ ] **GREEN — Backend (Repository → Controller):**
  - [ ] [Repository] In `search.repository.ts`, update the subcategory query to include
    `category: { select: { slug: true } }` in the Prisma `include` block.
  - [ ] [Controller] In `search.controller.ts`, update the subcategory serializer to
    add `categorySlug: subCategory.category.slug` to each result object.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`SearchResultsPage.test.tsx`):**
  - [ ] Test: When a subcategory result with `{ slug: 'dairy', categorySlug: 'groceries' }`
    is clicked, the component calls `navigate('/categories/groceries/dairy')`.
  - [ ] Test: When a subcategory result has a missing `categorySlug`, the component
    falls back to `navigate('/search?q=Dairy')` (safety net).
  - [ ] **Run — confirm RED (the component currently always calls `/search?q=...`).**

- [ ] **GREEN — Frontend (Types → Component):**
  - [ ] [Types] Add `categorySlug?: string` to the `SearchResultItem` type in
    `SearchResultsPage.tsx`.
  - [ ] [Component] Replace the hardcoded `navigate('/search?q=${sub.name}')` in the
    subcategory button's `onClick` handler with:
    ```typescript
    if (sub.categorySlug && sub.slug) {
      navigate(`/categories/${sub.categorySlug}/${sub.slug}`);
    } else {
      navigate(`/search?q=${sub.name}`);
    }
    ```
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] User types "dairy" in the search bar → Search Results page shows a
    "Dairy" subcategory card → User clicks it → Browser navigates to
    `/categories/groceries/dairy` → `SubCategoryPage` renders the list of
    dairy products from the database → ✅ Done.
```

---

## Part 5: Example B — A New Feature

**The Feature:** Implement idempotency on `POST /api/v1/orders`. A user who double-taps "Place Order" or whose network retries the request should not get duplicate orders.

> ✅ **Check this example against the rubric:**
> 1. Root Cause? ✅ (quotes the spec rule)
> 2. "Run — confirm RED"? ✅ (twice — once for integration, once for unit)
> 3. Integration test on real HTTP route? ✅ (tests `POST /api/v1/orders` twice)
> 4. Unit/component test? ✅ (tests the controller's Redis logic in isolation)
> 5. All tiers listed? ✅ (Redis, Controller, Routes wiring, Deps injection)
> 6. Hyper-specific assertions? ✅ (same `orderId`, exactly ONE `Order` row in DB)
> 7. Verification Chain? ✅
>
> **Verdict: GREAT CHECKLIST ✅**

```markdown
#### W-014 — Idempotency Key Not Honoured on POST /api/v1/orders

**Goal:**
`rules_and_spec.md §4` states: "All POST endpoints for orders and payments MUST
accept and honor X-Idempotency-Key header." Currently, `order.controller.ts` ignores
this header entirely. A user who double-taps "Place Order" or whose mobile connection
drops and retries will create two separate orders and be charged twice.

**Approach:**
In `order.controller.ts`, before calling `buyerCheckout.placeFromCart()`, check the
`X-Idempotency-Key` request header. Look up `idempotency:{buyerId}:{key}` in Redis.
On a cache hit, return the cached JSON response directly. On a cache miss, run
`placeFromCart`, store the serialised response in Redis with a 24-hour TTL, then
return the response.

---

- [ ] **RED — Integration (`order.controller.test.ts`):**
  - [ ] Test: Make `POST /api/v1/orders` with header `X-Idempotency-Key: test-key-abc`.
    Receive a response with an `orderId`. Make the **exact same request again**
    with the **same header**. Assert both responses contain the **same `orderId`**.
  - [ ] Test: After both requests, query the database and assert there is exactly
    **ONE `Order` row** for this buyer.
  - [ ] Test: Make a `POST /api/v1/orders` request **without** the header. Assert it
    still works normally (idempotency is optional, not enforced).
  - [ ] **Run — confirm RED (two separate orders are created by the two requests today).**

- [ ] **GREEN — Backend (Controller → Routes wiring):**
  - [ ] [Deps] Add `redis: RedisClientType` to the `RegisterOrderDeps` type in
    `order.controller.ts`.
  - [ ] [Controller] At the start of the `POST /api/v1/orders` handler, before any
    other logic:
    - Read `const key = request.headers['x-idempotency-key']`.
    - If `key` is present, check Redis for `await redis.get('idempotency:${buyerId}:${key}')`.
    - If a value is found (cache hit), `return reply.send(JSON.parse(cachedValue))`.
    - If nothing found (cache miss), continue with `placeFromCart`. After receiving
      the result, `await redis.set('idempotency:${buyerId}:${key}', JSON.stringify(result), { EX: 86400 })`.
  - [ ] [Routes] In `routes.ts`, update the call to `registerOrderRoutes` to pass in
    the Redis client alongside its existing dependencies.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`order.controller.unit.test.ts`):**
  - [ ] Set up: Mock the `placeFromCart` service and the Redis client.
  - [ ] Test (cache hit): Pre-populate the mock Redis with a value at the expected key.
    Call the handler. Assert `placeFromCart` was called **zero times** and the
    response is the pre-populated cached data.
  - [ ] Test (cache miss): Mock Redis to return `null`. Call the handler. Assert
    `placeFromCart` was called **exactly once** and that Redis `set` was called
    with the result.
  - [ ] **Run — confirm RED (the controller has no Redis logic, so the mocks are never called).**

- [ ] **GREEN — Frontend (No frontend changes needed):**
  - [ ] The frontend must send the `X-Idempotency-Key` header when placing an order.
    In `CheckoutPage.tsx`, generate a UUID before the API call:
    ```typescript
    import { v4 as uuidv4 } from 'uuid';
    // Inside placeOrder handler:
    const idempotencyKey = uuidv4();
    await api.post('/api/v1/orders', payload, {
      headers: { 'X-Idempotency-Key': idempotencyKey }
    });
    ```
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] User fills in checkout form and double-taps the "Place Order" button rapidly
    (simulating a slow network) → Two `POST /api/v1/orders` requests fire with
    the same `X-Idempotency-Key` → The second request hits the Redis cache and
    returns the first order's response instantly → The database contains exactly
    one `Order` row → User sees the single Order Confirmation page → ✅ Done.
```

---

## Part 6: The One Rule That Summarises Everything

If you only remember one thing from this guide, make it this:

> **A feature is not done when the tests pass.**
> **A feature is done when the Verification Chain is achieved in the real, running application.**

Tests are the tool that proves the Verification Chain is achieved *every time*, automatically. But the Verification Chain itself is the true definition of done.

If you start from the Verification Chain and work backwards (what frontend state is needed? what API response is needed? what DB schema is needed?), you will naturally write great checklists every time.
