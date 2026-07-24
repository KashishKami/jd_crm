# Phase 36: Follow-Up Closed Outcome Days Label Hiding & Multi-Select Status Filter

### Top Table Summary Line (Copy and add to Progress Table in `CONTEXT/current_state.md`):
```markdown
| Phase 36 | Follow-Up Closed Outcome Days Label Hiding & Multi-Select Status Filter | 🟡 IN PROGRESS | W-3601 (Closed Outcome Days Label Suppression), W-3602 (Multi-Select Status Filter & Prisma `{ in: [...] }` Querying) |
```

---

### Detailed Phase 36 Breakdown (Copy and add under Phases section in `CONTEXT/current_state.md`):

```markdown
### Phase 36 — Follow-Up Closed Outcome Days Label Hiding & Multi-Select Status Filter

**Goal:** Hide relative days label badges for all closed outcomes (`Not Interested` & `Sale Closed`) and implement a modern multi-select status filter dropdown for the Follow-Ups page.

- [ ] **W-3601: Days Label Suppression for Closed Outcomes ("Not Interested" & "Sale Closed")**
  - **Root Cause:** `FollowUpList.tsx` currently only checks `f.status !== 'Not Interested'`. `Sale Closed` is also a completed outcome but still renders relative time badges.
  - **Tiers Touched:** Frontend Component (`src/components/FollowUpList.tsx`), Component Test Suite (`src/tests/FollowUpList.test.tsx`).
  - [ ] **RED — Unit Test (`src/tests/FollowUpList.test.tsx`):**
    - [ ] Add test assertion: A follow-up item with `status: 'Sale Closed'` must NOT render the `daysLabel` badge.
    - [ ] **Run — confirm RED.**
  - [ ] **GREEN — Implementation (`src/components/FollowUpList.tsx`):**
    - [ ] Update status check to `{!['Not Interested', 'Sale Closed'].includes(f.status) && (...)}`.
    - [ ] **Run — confirm GREEN (`npx vitest run src/tests/FollowUpList.test.tsx`).**

- [ ] **W-3602: Multi-Select Status Filter & Prisma `{ in: [...] }` Query Engine**
  - **Root Cause:** `FollowUpFilters.status` is currently a single string, and `followup.repository.ts` applies `where.status = filters.status`. Agents cannot filter by multiple statuses simultaneously.
  - **Tiers Touched:** Types (`src/types/followup.ts`), Repository (`src/repository/followup.repository.ts`), Service (`src/service/followup.service.ts`), API Route (`src/app/api/followups/route.ts`), UI Component (`src/components/FollowUpListContainer.tsx`), Test Suites (`src/tests/followups.test.ts`, `src/tests/FollowUpListContainer.test.tsx`).
  - [ ] **RED — Integration & Component Tests:**
    - [ ] `src/tests/followups.test.ts`: Call `getAllFollowUps` with comma-separated statuses `status: 'Interested,Call Back Later'`. Assert returned items match only those statuses.
    - [ ] `src/tests/FollowUpListContainer.test.tsx`: Render multi-select status dropdown, select multiple statuses, assert `global.fetch` was called with `status=Interested%2CCall+Back+Later`.
    - [ ] **Run — confirm RED.**
  - [ ] **GREEN — Implementation:**
    - [ ] `src/types/followup.ts`: Update `FollowUpFilters` interface to support `status?: string | string[]`.
    - [ ] `src/repository/followup.repository.ts`: Update `where.status` query logic to handle array or comma-separated status values (`where.status = { in: statuses }`).
    - [ ] `src/components/FollowUpListContainer.tsx`: Replace single `<select>` with a multi-select checkbox dropdown component. Sync array selection with URL via `getSafeUrlParam`.
    - [ ] **Run — confirm GREEN (`npx vitest run src/tests/followups.test.ts src/tests/FollowUpListContainer.test.tsx`).**
```
