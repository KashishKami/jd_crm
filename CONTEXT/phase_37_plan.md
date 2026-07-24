# Phase 37 Plan: Follow-Up Persistent Overdue Notification Tab in Navbar

This file contains the **Migration Progress Summary** entry and the full TDD checklist for **Phase 37**, ready to be copied into `CONTEXT/current_state.md`.

---

## 1. Migration Progress Summary Row

```markdown
| **Phase 37** | Follow-Up Persistent Overdue Notification Tab in Navbar | **[x] COMPLETED** | `src/components/Navbar.tsx`, `src/lib/useFollowUpNotifications.ts`, `src/app/api/follow-ups/due/route.ts`, `src/repository/followup.repository.ts`, `src/service/followup.service.ts`, `src/app/components.css`, `src/tests/useFollowUpNotifications.test.ts`, `src/tests/Navbar.test.tsx`, `src/tests/followups.test.ts` |
```

---

## 2. Phase 37 TDD Checklist

### Phase 37 — Follow-Up Persistent Overdue Notification Tab in Navbar

#### W-3701 — Backend Overdue Notification Query & Service Filtering

**Root cause / Goal:**
Currently, `/api/follow-ups/due` queries records where `notification_sent_at IS NULL`. Once an in-app toast is closed, `notificationSentAt` is stamped, permanently hiding the notification from future polls. If an agent becomes busy or misses the toast, there is no persistent indicator in the app that they have pending overdue follow-ups. To support a persistent Notification Tab in the navbar, the backend query must return all overdue follow-ups assigned to the logged-in agent (`agentId = session.user.id`) where status is NOT `Sale Closed` and NOT `Not Interested`, and scheduled time (`followUpDate` + `followUpTime` in `customerTimezone`) is `<=` current time.

**Fix / Approach:**
Update `findDueForNotification` in `src/repository/followup.repository.ts` to accept `agentId` and query `crm_follow_ups` for all active overdue records (`agent_id = agentId AND status NOT IN ('Sale Closed', 'Not Interested') AND CONVERT_TZ(...) <= UTC_TIMESTAMP()`). Update `getDueFollowUps` in `src/service/followup.service.ts` to calculate human-readable relative overdue labels (using `computeDaysLabel`) and ensure hard self-only agent scoping.

---

- [x] **RED — Integration (`src/tests/followups.test.ts`):**
  - [x] Test: `GET /api/follow-ups/due` returns active overdue records belonging to the authenticated agent.
  - [x] Test: `GET /api/follow-ups/due` excludes follow-ups with status `'Sale Closed'` or `'Not Interested'`.
  - [x] Test: `GET /api/follow-ups/due` excludes follow-ups scheduled for future date/times (`followUpDate` + `followUpTime` > now).
  - [x] Test: `GET /api/follow-ups/due` returns active overdue follow-ups regardless of whether `notificationSentAt` is null or populated (persisting across toast dismissals).
  - [x] **Run — confirm RED (current endpoint filters on `notificationSentAt IS NULL` and 5-minute window).**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Update `findDueForNotification(agentId: number)` in `src/repository/followup.repository.ts` to query `crm_follow_ups` for `agent_id = agentId AND status NOT IN ('Sale Closed', 'Not Interested') AND CONVERT_TZ(...) <= UTC_TIMESTAMP()`.
  - [x] [Service] Update `getDueFollowUps(sessionUser)` in `src/service/followup.service.ts` to pass `sessionUser.id` and map `daysLabel` computed via `computeDaysLabel(f.followUpDate, f.followUpTime, f.customerTimezone)`.
  - [x] [Controller] Ensure `GET /api/follow-ups/due` returns HTTP 200 OK with the array of active overdue records.
  - [x] Run integration test — **confirm GREEN**.

---

#### W-3702 — Persistent Notification Bell Icon, Badge & Scrollable Card in Navbar

**Root cause / Goal:**
Agents need a persistent, attention-grabbing visual indicator in the top navbar when they have overdue follow-ups. The Notification Tab (bell icon) must sit just left of the Profile Avatar button in `Navbar.tsx`, display an unread count badge with a jumping/pulsing animation when count > 0, and open a scrollable dropdown card allowing the agent to view and click through to any overdue follow-up.

**Fix / Approach:**
Refactor `useFollowUpNotifications.ts` to expose `overdueList`, `dueCount`, and `refetch()`. Update `Navbar.tsx` to render the notification bell button (`.notification-bell-btn`) to the left of `.user-profile-btn`. Add an animated badge (`.notification-badge.jumping`) when `dueCount > 0`. Render a scrollable dropdown card (`.notification-dropdown-menu`) displaying customer name, part required, relative overdue label, and priority indicator. Clicking an item navigates to `/follow-ups/${id}`. Add styling and `@keyframes notification-jump` in `src/app/components.css`.

---

- [x] **RED — Unit / Component (`src/tests/useFollowUpNotifications.test.ts` & `src/tests/Navbar.test.tsx`):**
  - [x] Test (`useFollowUpNotifications.test.ts`): Hook polls `/api/follow-ups/due` and returns `overdueList` and `dueCount`.
  - [x] Test (`Navbar.test.tsx`): Renders notification bell icon button immediately to the left of the user profile button.
  - [x] Test (`Navbar.test.tsx`): When `dueCount > 0`, renders red badge with count and animated jumping class.
  - [x] Test (`Navbar.test.tsx`): Clicking notification bell toggles the notification card dropdown displaying overdue items with customer names and relative overdue labels.
  - [x] Test (`Navbar.test.tsx`): Clicking a notification item closes dropdown and navigates to `/follow-ups/${id}`.
  - [x] **Run — confirm RED (notification bell icon and dropdown card do not exist in Navbar).**

- [x] **GREEN — Frontend (Types → Hook → Component → CSS):**
  - [x] [Hook] Refactor `src/lib/useFollowUpNotifications.ts` to return `overdueList`, `dueCount`, `pollDueFollowUps`, and maintain polling interval (30s) + window focus listener.
  - [x] [Component] In `src/components/Navbar.tsx`, call `useFollowUpNotifications()`. Add `<button className="notification-bell-btn">` inside `.navbar-right` before the user profile button. Render badge `<span className="notification-badge jumping">` when `dueCount > 0`. Render dropdown `<div className="notification-dropdown-menu">` with click handlers.
  - [x] [Styling] Add `.notification-bell-btn`, `.notification-badge`, `.notification-badge.jumping`, `.notification-dropdown-menu`, `.notification-item`, and `@keyframes notification-jump` in `src/app/components.css`.
  - [x] Run unit test — **confirm GREEN**.

---

- [x] **Verification chain:**
  - [x] Agent logs in → Top Navbar renders Notification Bell Icon to the left of Profile Avatar.
  - [x] Follow-up scheduled for 10 minutes ago becomes due → Bell badge shows `1` with a jumping animation.
  - [x] Agent clicks Bell Icon → Scrollable Notification dropdown card opens displaying Customer Name, Part Required, and "Overdue by 10m".
  - [x] Agent clicks item → Navigates to `/follow-ups/[id]` detail page.
  - [x] Agent changes status to `Sale Closed` or `Not Interested`, OR reschedules date/time to tomorrow.
  - [x] Bell badge count drops to `0`, badge disappears, and card updates to "All caught up! No overdue follow-ups." → ✅ Done.
