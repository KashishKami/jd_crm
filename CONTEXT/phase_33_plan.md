# Phase 33 — Call Disposition Module + Follow-Up Status Dropdown Update

## Summary

This phase adds a brand-new **Call Disposition** page that allows agents to log the outcome of every inbound call (phone number, customer name, and disposition type). It also updates the Follow-Up status dropdown with an expanded list of values. No architectural changes — this phase follows the same three-layer (Repository → Service → Route) pattern established in Phase 31 (Follow-Ups) and uses the identical dual-permission RBAC model.

---

## Work Item W-3301 — Call Disposition Module (Full Stack)

### Goal

Build a Call Disposition feature that enables agents to record what happened on each inbound call, gives admins full cross-agent visibility, and provides an admin-only Excel export. The feature mirrors the `follow-ups:view` / `follow-ups:create` permission model exactly.

**Permission behaviour:**
- `call-dispositions:view` (ID 60) — Admin level. Sees all agents' records. Has Team + Agent filter controls. Has Agent Name column in table. Can delete any record. Can export to Excel.
- `call-dispositions:create` (ID 61) — Agent level. Sees only their own records. No Team/Agent filters. No Agent Name column. Cannot delete. Cannot export. Can create and edit own records.

### Approach

1. Run a Prisma migration to create `crm_call_dispositions` table.
2. Add permissions 60 and 61 to `seed.sql` and assign to roles.
3. Update `prisma/schema.prisma` with the new model and reverse relations.
4. Create types, repository, service, and API route files.
5. Install `xlsx` package and build the export route (admin-only).
6. Build UI: `AddDispositionModal`, `EditDispositionModal`, `CallDispositionList`, `CallDispositionListContainer`, and the page.
7. Wire middleware, Sidebar, and Navbar.

---

### RED — Integration Tests (`src/tests/callDispositions.test.ts`)

> Create this file before writing any implementation code. Run it to confirm all tests fail (RED).

**Test setup:** The test file must create two test users before tests run:
- `testAdminId` — a user seeded with both `call-dispositions:view` AND `call-dispositions:create` permissions (IDs 60 and 61).
- `testAgentId` — a user seeded with only `call-dispositions:create` permission (ID 61).
- `otherAgentId` — a third user also with only `call-dispositions:create` (to test ownership enforcement).

---

- [ ] **RED — Integration (`callDispositions.test.ts`):**
  - [ ] Test 1: `GET /api/call-dispositions` with no session returns `401 Unauthorized`.
  - [ ] Test 2: `GET /api/call-dispositions` with a session having neither permission (IDs 60 or 61) returns `403 Forbidden`.
  - [ ] Test 3: `GET /api/call-dispositions` with `testAdmin` session (has view permission) returns `200 OK` and JSON `{ dispositions: [], total: 0 }` (empty DB at start).
  - [ ] Test 4: `POST /api/call-dispositions` with `testAgent` session and body `{ customerPhone: '555-123-4567', disposition: 'Wrong Number' }` returns `201 Created`. After the call, assert: `SELECT * FROM crm_call_dispositions WHERE call_id = <returned_id>` returns exactly one row where `agent_id = testAgentId`, `team_id = testAgentTeamId`, `customer_name IS NULL`, `customer_phone = '555-123-4567'`, `disposition = 'Wrong Number'`.
  - [ ] Test 5: `POST /api/call-dispositions` with `testAgent` session and body `{ customerPhone: '5551234567', customerName: 'John Doe', disposition: 'Price Quoted' }` returns `201 Created`. Assert: `customer_phone = '555-123-4567'` (formatted) and `customer_name = 'John Doe'` in DB.
  - [ ] Test 6: `POST /api/call-dispositions` where the request body contains `{ agentId: 9999, agentName: 'Fake Agent', teamId: 9999, customerPhone: '555-000-0000', disposition: 'Spam Call' }` — with `testAgent` session — returns `201 Created` but asserts that the DB row has `agent_id = testAgentId` (from session), NOT 9999. Server must always override agentId, agentName, and teamId from session.
  - [ ] Test 7: `POST /api/call-dispositions` without `customerPhone` in body returns `400 Bad Request`.
  - [ ] Test 8: `POST /api/call-dispositions` without `disposition` in body returns `400 Bad Request`.
  - [ ] Test 9: `POST /api/call-dispositions` with `disposition: 'InvalidValue'` (not in the 13 allowed values) returns `400 Bad Request`.
  - [ ] Test 10: `POST /api/call-dispositions` with a session having neither permission returns `403 Forbidden`.
  - [ ] Test 11: Seed two dispositions — one for `testAgentId` and one for `otherAgentId`. `GET /api/call-dispositions` with `testAgent` session (only `create` permission, no `view`) returns `200 OK` with `total: 1` and only the record belonging to `testAgentId`. The record for `otherAgentId` is NOT returned regardless of any `agentId` query param sent by the client.
  - [ ] Test 12: `GET /api/call-dispositions` with `testAdmin` session (has `view` permission) returns `200 OK` with `total: 2` (both agents' records visible).
  - [ ] Test 13: `GET /api/call-dispositions?disposition=Wrong+Number` with `testAdmin` session returns only records where `disposition = 'Wrong Number'`.
  - [ ] Test 14: `GET /api/call-dispositions?dateFrom=2025-01-01&dateTo=2025-01-31` returns only records whose `created_at` falls within that date range.
  - [ ] Test 15: `GET /api/call-dispositions?agentId=<testAgentId>` with `testAdmin` session (has view) returns only that agent's records.
  - [ ] Test 16: `GET /api/call-dispositions?agentId=<otherAgentId>` with `testAgent` session (only create, no view) — backend ignores the `agentId` query param and still returns only `testAgent`'s own records (`total: 1`).
  - [ ] Test 17: `PATCH /api/call-dispositions/:id` where `:id` belongs to `testAgentId`, with `testAgent` session, and body `{ customerName: 'Jane Doe' }` returns `200 OK`. Assert DB row has `customer_name = 'Jane Doe'`.
  - [ ] Test 18: `PATCH /api/call-dispositions/:id` where `:id` belongs to `testAgentId`, with `otherAgent` session (different user, also create-only) returns `403 Forbidden`. Non-owner cannot edit another agent's record.
  - [ ] Test 19: `PATCH /api/call-dispositions/:id` where `:id` does not exist returns `404 Not Found`.
  - [ ] Test 20: `DELETE /api/call-dispositions/:id` with `testAdmin` session (has `view`) deletes the record. Assert `SELECT COUNT(*) FROM crm_call_dispositions WHERE call_id = :id` returns `0`.
  - [ ] Test 21: `DELETE /api/call-dispositions/:id` with `testAgent` session (only `create`, no `view`) returns `403 Forbidden`.
  - [ ] Test 22: `GET /api/call-dispositions/export` with `testAdmin` session (has `view`) returns `200 OK` with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition` header containing `call-dispositions-export.xlsx`.
  - [ ] Test 23: `GET /api/call-dispositions/export` with `testAgent` session (only `create`, no `view`) returns `403 Forbidden`.
  - [ ] **Run — confirm RED (all routes return 404 since they don't exist yet).**

---

### GREEN — Backend

#### Step B1 — Install Package

```bash
npm install xlsx
```

Verify: `package.json` now lists `xlsx` under `dependencies`.

---

#### Step B2 — Prisma Schema (`prisma/schema.prisma`)

Add the `CrmCallDispositions` model. The model goes **after** the `CrmFollowUps` model block.

```prisma
model CrmCallDispositions {
  callId        Int      @id @default(autoincrement()) @map("call_id")
  customerPhone String   @map("customer_phone") @db.VarChar(25)
  customerName  String?  @map("customer_name") @db.VarChar(255)
  agentId       Int      @map("agent_id")
  agentName     String   @map("agent_name") @db.VarChar(55)
  teamId        Int      @map("team_id")
  disposition   String   @map("disposition") @db.VarChar(50)
  createdAt     DateTime @default(now()) @map("created_at") @db.DateTime(0)
  updatedAt     DateTime @updatedAt @map("updated_at") @db.DateTime(0)

  agent         Users    @relation("DispositionAgent", fields: [agentId], references: [uid], onDelete: Restrict)
  team          CrmTeams @relation("TeamDispositions", fields: [teamId], references: [teamId], onDelete: Restrict)

  @@index([agentId])
  @@index([teamId])
  @@index([disposition])
  @@index([createdAt])
  @@map("crm_call_dispositions")
}
```

In the `Users` model, add this line in the relations section:
```prisma
callDispositions  CrmCallDispositions[] @relation("DispositionAgent")
```

In the `CrmTeams` model, add this line in the relations section:
```prisma
callDispositions  CrmCallDispositions[] @relation("TeamDispositions")
```

---

#### Step B3 — Prisma Migration

Run:
```bash
npx prisma migrate dev --name add_call_dispositions_table
```

Prisma will generate a migration file at `prisma/migrations/<timestamp>_add_call_dispositions_table/migration.sql`. The SQL content should match:

```sql
-- CreateTable
CREATE TABLE `crm_call_dispositions` (
    `call_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_phone` VARCHAR(25) NOT NULL,
    `customer_name` VARCHAR(255) NULL,
    `agent_id` INTEGER NOT NULL,
    `agent_name` VARCHAR(55) NOT NULL,
    `team_id` INTEGER NOT NULL,
    `disposition` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `crm_call_dispositions_agent_id_idx`(`agent_id`),
    INDEX `crm_call_dispositions_team_id_idx`(`team_id`),
    INDEX `crm_call_dispositions_disposition_idx`(`disposition`),
    INDEX `crm_call_dispositions_created_at_idx`(`created_at`),
    PRIMARY KEY (`call_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

-- AddForeignKey
ALTER TABLE `crm_call_dispositions` ADD CONSTRAINT `crm_call_dispositions_agent_id_fkey`
  FOREIGN KEY (`agent_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_call_dispositions` ADD CONSTRAINT `crm_call_dispositions_team_id_fkey`
  FOREIGN KEY (`team_id`) REFERENCES `crm_teams`(`team_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

**Verify:** Run `SHOW CREATE TABLE crm_call_dispositions;` and confirm InnoDB engine, utf8mb4_unicode_ci collation, and both FK constraints exist.

---

#### Step B4 — Seed File (`seed.sql`)

**4a.** In the `INSERT INTO crm_permissions` block, after the last line:
```sql
(59, 'follow-ups:create', 'Agent-level: create and view own follow-ups only')
```
Change that line's trailing `)` to `,` and add:
```sql
(60, 'call-dispositions:view',   'Admin-level: view all call dispositions across all agents, full filter controls, delete, and Excel export'),
(61, 'call-dispositions:create', 'Agent-level: create and view own call dispositions only, no delete, no export')
```
Keep `ON DUPLICATE KEY UPDATE permission_description = VALUES(permission_description);` at the end.

**4b.** In the Super Admin role block (`role_id = 1`), append `(1,60),(1,61)` before the closing semicolon.

**4c.** In the Admin role block (`role_id = 2`), append `(2,60),(2,61)` before the closing semicolon.

**4d.** Add a new block after the Agent block:
```sql
-- Agent (role_id = 8) — call-dispositions:create permission only
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(8,61);
```

---

#### Step B5 — TypeScript Types (`src/types/callDisposition.ts`)

Create this file. Contents:

```typescript
// The 13 allowed disposition values. Used in service-layer validation and UI dropdowns.
export const DISPOSITION_OPTIONS = [
  'Wrong Number',
  'Spam Call',
  'Local Pickup',
  'Part Not Available',
  'Spanish Call',
  'Price Quoted',
  'Sale Closed',
  'Follow-up',
  'Not Interested',
  'No Voice',
  'Low Ad Price',
  'Automated Call',
  'Small Parts',
] as const;

export type DispositionOption = typeof DISPOSITION_OPTIONS[number];

export interface CallDispositionRecord {
  callId: number;
  customerPhone: string;
  customerName: string | null;
  agentId: number;
  agentName: string;
  teamId: number;
  disposition: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Fields accepted from the client on CREATE. agentId, agentName, teamId are NEVER in this type — always from session.
export interface CallDispositionCreateInput {
  customerPhone: string;
  customerName?: string | null;
  disposition: string;
}

// Fields accepted from the client on UPDATE. Same restriction — no agent/team fields.
export interface CallDispositionUpdateInput {
  customerPhone?: string;
  customerName?: string | null;
  disposition?: string;
}

export interface CallDispositionFilters {
  agentId?: number;
  teamId?: number;
  disposition?: string;
  dateFrom?: string;  // ISO date string 'YYYY-MM-DD'
  dateTo?: string;    // ISO date string 'YYYY-MM-DD'
  page?: number;
  limit?: number;
}

export interface CallDispositionListResult {
  dispositions: CallDispositionRecord[];
  total: number;
}
```

---

#### Step B6 — Repository (`src/repository/callDisposition.repository.ts`)

Create this file. Import `prisma` from `'../lib/db'`. Import `CallDispositionFilters`, `CallDispositionListResult`, `CallDispositionRecord` from `'../types/callDisposition'`.

**`findAll(filters: CallDispositionFilters): Promise<CallDispositionListResult>`**

```typescript
export async function findAll(filters: CallDispositionFilters): Promise<CallDispositionListResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.agentId)     where.agentId = filters.agentId;
  if (filters.teamId)      where.teamId = filters.teamId;
  if (filters.disposition) where.disposition = filters.disposition;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom + 'T00:00:00.000Z');
    if (filters.dateTo)   where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
  }

  const [dispositions, total] = await prisma.$transaction([
    prisma.crmCallDispositions.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.crmCallDispositions.count({ where }),
  ]);

  return { dispositions: dispositions as CallDispositionRecord[], total };
}
```

**`findAll_noLimit(filters: CallDispositionFilters): Promise<CallDispositionRecord[]>`**
Same as `findAll` but without `skip`/`take` — used by the export route to fetch all matching records.

```typescript
export async function findAll_noLimit(filters: CallDispositionFilters): Promise<CallDispositionRecord[]> {
  const where: any = {};
  if (filters.agentId)     where.agentId = filters.agentId;
  if (filters.teamId)      where.teamId = filters.teamId;
  if (filters.disposition) where.disposition = filters.disposition;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom + 'T00:00:00.000Z');
    if (filters.dateTo)   where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
  }
  return prisma.crmCallDispositions.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  }) as Promise<CallDispositionRecord[]>;
}
```

**`findById(id: number): Promise<CallDispositionRecord | null>`**
```typescript
export async function findById(id: number): Promise<CallDispositionRecord | null> {
  return prisma.crmCallDispositions.findUnique({
    where: { callId: id },
  }) as Promise<CallDispositionRecord | null>;
}
```

**`create(data: { customerPhone: string; customerName?: string | null; agentId: number; agentName: string; teamId: number; disposition: string; })`**
```typescript
export async function create(data: {
  customerPhone: string;
  customerName?: string | null;
  agentId: number;
  agentName: string;
  teamId: number;
  disposition: string;
}) {
  return prisma.crmCallDispositions.create({ data });
}
```

**`update(id: number, data: CallDispositionUpdateInput)`**
```typescript
export async function update(id: number, data: CallDispositionUpdateInput) {
  return prisma.crmCallDispositions.update({
    where: { callId: id },
    data,
  });
}
```

**`remove(id: number)`** (named `remove` to avoid conflict with JS reserved word `delete`)
```typescript
export async function remove(id: number) {
  return prisma.crmCallDispositions.delete({
    where: { callId: id },
  });
}
```

---

#### Step B7 — Service (`src/service/callDisposition.service.ts`)

Create this file.

```typescript
import * as callDispositionRepository from '../repository/callDisposition.repository';
import { hasPermission } from './permission.service';
import { formatPhoneNumber } from '../lib/formatPhone';
import {
  CallDispositionCreateInput,
  CallDispositionUpdateInput,
  CallDispositionFilters,
  CallDispositionListResult,
  CallDispositionRecord,
  DISPOSITION_OPTIONS,
} from '../types/callDisposition';

type SessionUser = {
  id: string | number;
  nickname?: string | null;
  name?: string | null;
  teamId?: string | number | null;
  userPermissions: string | null | undefined;
};

export async function getAllDispositions(
  sessionUser: SessionUser,
  rawFilters: CallDispositionFilters
): Promise<CallDispositionListResult> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'call-dispositions:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const filters: CallDispositionFilters = { ...rawFilters };

  // Agent-level: always force scope to own records, ignore any client-sent agentId/teamId
  if (!isViewAll) {
    filters.agentId = Number(sessionUser.id);
    delete filters.teamId;
  }

  return callDispositionRepository.findAll(filters);
}

export async function getDispositionById(
  sessionUser: SessionUser,
  id: number
): Promise<CallDispositionRecord | null> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'call-dispositions:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const record = await callDispositionRepository.findById(id);
  if (!record) return null;

  // Agent-level: must own the record to view it
  if (!isViewAll && record.agentId !== Number(sessionUser.id)) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  return record;
}

export async function createDisposition(
  sessionUser: SessionUser,
  data: CallDispositionCreateInput
) {
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'call-dispositions:create');
  if (!isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  // Validate required fields
  if (!data.customerPhone || data.customerPhone.trim() === '') {
    throw new Error('Bad Request: customerPhone is required');
  }
  if (!data.disposition || data.disposition.trim() === '') {
    throw new Error('Bad Request: disposition is required');
  }
  if (!(DISPOSITION_OPTIONS as readonly string[]).includes(data.disposition)) {
    throw new Error(`Bad Request: disposition must be one of: ${DISPOSITION_OPTIONS.join(', ')}`);
  }

  // Format phone number to xxx-xxx-xxxx
  const formattedPhone = formatPhoneNumber(data.customerPhone);

  const agentName = sessionUser.nickname || sessionUser.name || 'Unknown';
  const agentId = Number(sessionUser.id);
  const teamId = Number(sessionUser.teamId) || 0;

  return callDispositionRepository.create({
    customerPhone: formattedPhone,
    customerName: data.customerName || null,
    agentId,
    agentName,
    teamId,
    disposition: data.disposition,
  });
}

export async function updateDisposition(
  sessionUser: SessionUser,
  id: number,
  data: CallDispositionUpdateInput
) {
  // getDispositionById handles permission check and ownership enforcement
  const existing = await getDispositionById(sessionUser, id);
  if (!existing) {
    throw new Error('Not Found: Disposition record not found');
  }

  const updateData: CallDispositionUpdateInput = {};
  if (data.customerPhone !== undefined) {
    updateData.customerPhone = formatPhoneNumber(data.customerPhone);
  }
  if (data.customerName !== undefined) {
    updateData.customerName = data.customerName || null;
  }
  if (data.disposition !== undefined) {
    if (!(DISPOSITION_OPTIONS as readonly string[]).includes(data.disposition)) {
      throw new Error(`Bad Request: disposition must be one of: ${DISPOSITION_OPTIONS.join(', ')}`);
    }
    updateData.disposition = data.disposition;
  }

  return callDispositionRepository.update(id, updateData);
}

export async function deleteDisposition(
  sessionUser: SessionUser,
  id: number
) {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  if (!isViewAll) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const existing = await callDispositionRepository.findById(id);
  if (!existing) {
    throw new Error('Not Found: Disposition record not found');
  }

  return callDispositionRepository.remove(id);
}

export async function getAllDispositionsForExport(
  sessionUser: SessionUser,
  rawFilters: CallDispositionFilters
): Promise<CallDispositionRecord[]> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'call-dispositions:view');
  if (!isViewAll) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const filters: CallDispositionFilters = { ...rawFilters };
  delete filters.page;
  delete filters.limit;

  return callDispositionRepository.findAll_noLimit(filters);
}
```

---

#### Step B8 — API Routes

**`src/app/api/call-dispositions/route.ts`** (GET list + POST create)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import * as callDispositionService from '../../../service/callDisposition.service';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const filters = {
    agentId:     searchParams.get('agentId')     ? Number(searchParams.get('agentId'))     : undefined,
    teamId:      searchParams.get('teamId')      ? Number(searchParams.get('teamId'))      : undefined,
    disposition: searchParams.get('disposition') ?? undefined,
    dateFrom:    searchParams.get('dateFrom')    ?? undefined,
    dateTo:      searchParams.get('dateTo')      ?? undefined,
    page:        searchParams.get('page')        ? Number(searchParams.get('page'))        : 1,
    limit:       searchParams.get('limit')       ? Number(searchParams.get('limit'))       : 20,
  };

  try {
    const result = await callDispositionService.getAllDispositions(session.user as any, filters);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const record = await callDispositionService.createDisposition(session.user as any, body);
    return NextResponse.json({ disposition: record }, { status: 201 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden'))    return NextResponse.json({ error: err.message }, { status: 403 });
    if (err.message.startsWith('Bad Request'))  return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**`src/app/api/call-dispositions/[id]/route.ts`** (GET single + PATCH update + DELETE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as callDispositionService from '../../../../service/callDisposition.service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  try {
    const record = await callDispositionService.getDispositionById(session.user as any, id);
    if (!record) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json({ disposition: record }, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  try {
    const body = await req.json();
    const record = await callDispositionService.updateDisposition(session.user as any, id, body);
    return NextResponse.json({ disposition: record }, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden'))   return NextResponse.json({ error: err.message }, { status: 403 });
    if (err.message.startsWith('Not Found'))   return NextResponse.json({ error: err.message }, { status: 404 });
    if (err.message.startsWith('Bad Request')) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  try {
    await callDispositionService.deleteDisposition(session.user as any, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    if (err.message.startsWith('Not Found')) return NextResponse.json({ error: err.message }, { status: 404 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**`src/app/api/call-dispositions/export/route.ts`** (GET — Excel download, admin only)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import * as callDispositionService from '../../../../service/callDisposition.service';
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filters = {
    agentId:     searchParams.get('agentId')     ? Number(searchParams.get('agentId'))     : undefined,
    teamId:      searchParams.get('teamId')      ? Number(searchParams.get('teamId'))      : undefined,
    disposition: searchParams.get('disposition') ?? undefined,
    dateFrom:    searchParams.get('dateFrom')    ?? undefined,
    dateTo:      searchParams.get('dateTo')      ?? undefined,
  };

  try {
    // getAllDispositionsForExport already throws Forbidden if lacking call-dispositions:view
    const records = await callDispositionService.getAllDispositionsForExport(session.user as any, filters);

    // Build worksheet rows
    const rows = records.map((r) => ({
      'Date (EST)':      DateTime.fromJSDate(new Date(r.createdAt)).setZone('America/New_York').toFormat('MM/dd/yyyy HH:mm'),
      'Customer Phone':  r.customerPhone,
      'Customer Name':   r.customerName ?? '',
      'Agent Name':      r.agentName,
      'Disposition':     r.disposition,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Dispositions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="call-dispositions-export.xlsx"',
      },
    });
  } catch (err: any) {
    if (err.message.startsWith('Forbidden')) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

- [ ] Run integration tests — **confirm GREEN.**

---

### RED — Unit Tests

#### `src/tests/AddDispositionModal.test.tsx`

- [ ] Test: Modal renders with these fields: "Phone Number *" text input, "Customer Name (Optional)" text input, "Disposition *" select dropdown with 13 options matching `DISPOSITION_OPTIONS`, and no Remarks field anywhere in the DOM.
- [ ] Test: Submitting the form with empty `customerPhone` does NOT call `fetch` and shows inline error text "Phone number is required".
- [ ] Test: Submitting the form with empty `disposition` does NOT call `fetch` and shows inline error text "Disposition is required".
- [ ] Test: Submitting the form with `customerPhone` filled and `customerName` left empty — `fetch` IS called with a body that does NOT include `customerName` or includes `customerName: ''` (the modal omits the field or sends empty string; the service normalises to null).
- [ ] Test: Submitting a valid form (`customerPhone: '555-123-4567'`, `disposition: 'Wrong Number'`) calls `POST /api/call-dispositions` and on `201` response calls the `onCreated` prop.
- [ ] Test: Clicking the × button in the header calls the `onClose` prop.
- [ ] Test: Clicking the backdrop overlay calls the `onClose` prop.
- [ ] **Run — confirm RED.**

#### `src/tests/CallDispositionList.test.tsx`

- [ ] Test: With `canViewAll = true`, the table header contains exactly these columns in this order: "Date", "Customer Phone", "Customer Name", "Agent Name", "Disposition", "Actions". No "Remarks" column.
- [ ] Test: With `canViewAll = false`, the table header contains: "Date", "Customer Phone", "Customer Name", "Disposition", "Actions". "Agent Name" is NOT present.
- [ ] Test: With `canViewAll = true`, each row's Actions cell contains both an Edit button and a Delete button.
- [ ] Test: With `canViewAll = false`, each row's Actions cell contains an Edit button but NO Delete button.
- [ ] Test: A record with `customerName: null` renders the Customer Name cell as "—" (an em-dash or similar placeholder).
- [ ] Test: Clicking the Edit button for a row calls `onEdit(callId)` with the correct `callId`.
- [ ] Test: Clicking the Delete button for a row shows an inline confirmation before calling `onDelete`. Assert that `onDelete` is NOT called without confirmation.
- [ ] **Run — confirm RED.**

---

### GREEN — Frontend

#### Step F1 — `AddDispositionModal.tsx` (`src/components/AddDispositionModal.tsx`)

Create this file.

**Props interface:**
```typescript
interface AddDispositionModalProps {
  onClose: () => void;
  onCreated: () => void;
}
```

**Key implementation rules:**
- `'use client'` directive at top.
- Uses `useState` for a `mounted` guard (same pattern as `FollowUpNotesPopup.tsx`) — `useEffect` sets `mounted = true` after a `setTimeout(0)`. The component returns `null` until `mounted = true`.
- Renders via `createPortal(content, document.body)` (import `createPortal` from `'react-dom'`).
- State: `customerPhone: ''`, `customerName: ''`, `disposition: ''`, `phoneError: ''`, `dispositionError: ''`, `apiError: ''`, `submitting: false`.
- **Backdrop**: `position: fixed, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 9999`. `onClick={onClose}`.
- **Card**: `backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '560px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'`. Use `onClick={(e) => e.stopPropagation()}` to prevent backdrop click from firing.
- **Header**: `padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc'`. Title: "Log Call Disposition" in Georgia serif font, `fontWeight: 700`. × button: `fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer'` → calls `onClose`.
- **Body**: `padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'`.
- **Form fields** (in this exact order):
  1. Phone Number input — label "Phone Number *". `type="text"`. `value={customerPhone}`. `onBlur`: call `formatPhoneNumber(customerPhone)` from `../lib/formatPhone` and update state. If `phoneError` is set, show `<p style={{ color: '#dc2626', fontSize: '0.8rem' }}>{phoneError}</p>` below the input. Apply `className="form-input"` (same class as other forms in the project).
  2. Customer Name input — label "Customer Name (Optional)". `type="text"`. `value={customerName}`. No validation error needed.
  3. Disposition select — label "Disposition *". First `<option value="">Select a disposition...</option>`, then map `DISPOSITION_OPTIONS` to `<option key={opt} value={opt}>{opt}</option>`. If `dispositionError`, show error below.
- **Footer** (below form fields):
  - If `apiError`, show `<p style={{ color: '#dc2626', fontSize: '0.85rem' }}>{apiError}</p>`.
  - Submit button: "Save Disposition" with `className="btn-primary-custom"`. Disabled when `submitting`.
  - Cancel button: "Cancel" — plain text link style → calls `onClose`.
- **Submit logic** (`handleSubmit`):
  1. Clear all errors.
  2. Validate: if `customerPhone.trim() === ''` → set `phoneError = 'Phone number is required'` → return.
  3. Validate: if `disposition === ''` → set `dispositionError = 'Disposition is required'` → return.
  4. Set `submitting = true`.
  5. `const body: Record<string, any> = { customerPhone, disposition };` — only add `customerName` to the body if `customerName.trim() !== ''`.
  6. `const res = await fetch('/api/call-dispositions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })`.
  7. If `!res.ok` → read error from response → set `apiError` → set `submitting = false` → return.
  8. Call `onCreated()` then `onClose()`.

---

#### Step F2 — `EditDispositionModal.tsx` (`src/components/EditDispositionModal.tsx`)

Create this file.

**Props interface:**
```typescript
interface EditDispositionModalProps {
  callId: number;
  onClose: () => void;
  onUpdated: () => void;
}
```

**Key implementation rules:**
- Same `mounted` guard, same `createPortal`, same overlay + card styles as `AddDispositionModal`.
- Additional state: `loading: true` (fetches existing record on mount), `record: CallDispositionRecord | null`.
- On mount (`useEffect` with `[callId]` dep): `fetch('/api/call-dispositions/${callId}')` → parse JSON → set `customerPhone = record.customerPhone`, `customerName = record.customerName ?? ''`, `disposition = record.disposition` → set `loading = false`.
- While `loading`, show a spinner in the card body (same spinner pattern as `OrderCommentsPopup`).
- Header title: "Edit Call Disposition".
- Same 3 form fields as Add modal, pre-filled with fetched values.
- **Submit logic** (`handleSubmit`): same validation → `PATCH /api/call-dispositions/${callId}` with body `{ customerPhone, disposition, customerName: customerName.trim() || null }` → on success call `onUpdated()` then `onClose()`.

---

#### Step F3 — `CallDispositionList.tsx` (`src/components/CallDispositionList.tsx`)

Create this file.

**Props interface:**
```typescript
interface CallDispositionListProps {
  dispositions: CallDispositionRecord[];
  canViewAll: boolean;
  onEdit: (callId: number) => void;
  onDelete: (callId: number) => void;
}
```

**Table structure:**

Admin view (`canViewAll = true`) — column order:
| # | Header | Cell content |
|---|--------|-------------|
| 1 | Date | `DateTime.fromJSDate(new Date(d.createdAt)).setZone('America/New_York').toFormat('MM/dd/yyyy HH:mm')` |
| 2 | Customer Phone | `d.customerPhone` |
| 3 | Customer Name | `d.customerName ?? '—'` |
| 4 | Agent Name | `d.agentName` |
| 5 | Disposition | Badge/pill element (see badge styles below) |
| 6 | Actions | Edit button + Delete button |

Agent view (`canViewAll = false`) — column order:
| # | Header | Cell content |
|---|--------|-------------|
| 1 | Date | same as above |
| 2 | Customer Phone | `d.customerPhone` |
| 3 | Customer Name | `d.customerName ?? '—'` |
| 4 | Disposition | Badge/pill element |
| 5 | Actions | Edit button only (NO Delete button) |

**Disposition badge colors** — use inline styles consistent with existing status badges in the project:
- `'Sale Closed'` → green background (`#dcfce7`), green text (`#166534`)
- `'Price Quoted'` → blue background (`#dbeafe`), blue text (`#1e40af`)
- `'Follow-up'` → amber background (`#fef9c3`), amber text (`#854d0e`)
- `'Not Interested'` → red background (`#fee2e2`), red text (`#991b1b`)
- `'Wrong Number'`, `'Spam Call'`, `'Automated Call'`, `'No Voice'` → slate background (`#f1f5f9`), slate text (`#475569`)
- All others → purple background (`#ede9fe`), purple text (`#5b21b6`)

**Delete confirmation:** Use local state `confirmDeleteId: number | null`. When Delete is clicked, set `confirmDeleteId = d.callId`. Render an inline confirm row (or replace the button with "Confirm?" + "Yes" + "Cancel" buttons inline in the cell). Only call `onDelete(callId)` when the user clicks "Yes".

**Empty state:** If `dispositions.length === 0`, render a single `<tr>` with one `<td colSpan={canViewAll ? 6 : 5}` containing centered text "No call dispositions found."

**Import:** Import `DateTime` from `'luxon'` and `CallDispositionRecord` from `'../types/callDisposition'`.

---

#### Step F4 — `CallDispositionListContainer.tsx` (`src/components/CallDispositionListContainer.tsx`)

Create this file. This is the main client component that wires together state, filters, fetch calls, modals, pagination.

**`'use client'`** directive at top.

**Imports:**
```typescript
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { hasPermission } from '../service/permission.service';
import CallDispositionList from './CallDispositionList';
import AddDispositionModal from './AddDispositionModal';
import EditDispositionModal from './EditDispositionModal';
import { DISPOSITION_OPTIONS } from '../types/callDisposition';
```

**State:**
```typescript
const [dispositions, setDispositions] = useState<any[]>([]);
const [loading, setLoading]           = useState(true);
const [error, setError]               = useState<string | null>(null);
const [teams, setTeams]               = useState<any[]>([]);
const [agents, setAgents]             = useState<any[]>([]);
const [dispositionFilter, setDispositionFilter] = useState('');
const [dateFrom, setDateFrom]         = useState('');
const [dateTo, setDateTo]             = useState('');
const [teamFilter, setTeamFilter]     = useState('');
const [agentFilter, setAgentFilter]   = useState('');
const [page, setPage]                 = useState(1);
const [totalPages, setTotalPages]     = useState(1);
const [totalItems, setTotalItems]     = useState(0);
const limit = 20;
// Modal state
const [showAddModal, setShowAddModal]   = useState(false);
const [editModalId, setEditModalId]     = useState<number | null>(null);
```

**Permissions:**
```typescript
const permissions = session?.user?.userPermissions || '';
const canViewAll  = hasPermission(permissions, 'call-dispositions:view');
const canCreate   = hasPermission(permissions, 'call-dispositions:create');
```

**Admin dropdown fetch:** `useEffect` on `[status, canViewAll]` — if `status === 'authenticated' && canViewAll`, fetch `/api/teams` and `/api/agents` in parallel and set state.

**Main fetch function (`fetchDispositions`):**
```typescript
const fetchDispositions = async () => {
  if (status !== 'authenticated') return;
  setLoading(true);
  setError(null);
  const q = new URLSearchParams();
  q.set('page', String(page));
  q.set('limit', String(limit));
  if (dispositionFilter) q.set('disposition', dispositionFilter);
  if (dateFrom) q.set('dateFrom', dateFrom);
  if (dateTo)   q.set('dateTo', dateTo);
  if (canViewAll) {
    if (teamFilter)  q.set('teamId', teamFilter);
    if (agentFilter) q.set('agentId', agentFilter);
  }
  try {
    const res = await fetch(`/api/call-dispositions?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch call dispositions.');
    const data = await res.json();
    setDispositions(data.dispositions || []);
    setTotalPages(Math.ceil((data.total || 0) / limit) || 1);
    setTotalItems(data.total || 0);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

`useEffect` deps: `[status, page, dispositionFilter, dateFrom, dateTo, teamFilter, agentFilter]`.

**Modal callbacks:**
- `onCreated`: close `AddDispositionModal` + call `fetchDispositions()`.
- `onUpdated`: close `EditDispositionModal` + call `fetchDispositions()`. The list re-fetches in place — no scroll to top because the DOM is not changing structurally (same page, same scroll position).

**Delete handler:**
```typescript
const handleDeleteDisposition = async (callId: number) => {
  const res = await fetch(`/api/call-dispositions/${callId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed.');
  setDispositions((prev) => prev.filter((d) => d.callId !== callId));
  setTotalItems((prev) => Math.max(0, prev - 1));
};
```

**Export handler:**
```typescript
const handleExport = () => {
  const q = new URLSearchParams();
  if (dispositionFilter) q.set('disposition', dispositionFilter);
  if (dateFrom)          q.set('dateFrom', dateFrom);
  if (dateTo)            q.set('dateTo', dateTo);
  if (teamFilter)        q.set('teamId', teamFilter);
  if (agentFilter)       q.set('agentId', agentFilter);
  window.open(`/api/call-dispositions/export?${q.toString()}`, '_blank');
};
```

**Rendered JSX structure:**

```
<div className="agents-page-container">
  {/* Page Header */}
  <div className="page-header">
    <div>
      <h1 className="page-title">Call Dispositions</h1>
      <p className="page-subtitle">Track inbound call outcomes and agent activity.</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {canViewAll && (
        <button onClick={handleExport} className="btn-secondary-custom">
          Export to Excel
        </button>
      )}
      {canCreate && (
        <button onClick={() => setShowAddModal(true)} className="btn-primary-custom">
          Add Disposition
        </button>
      )}
    </div>
  </div>

  {/* Filter Bar */}
  <div className="filters-container">
    <div className="filters-row">
      {canViewAll && (
        <>
          {/* Team dropdown */}
          <div className="filter-select-wrapper">
            <label className="form-label">Center (Team)</label>
            <select value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setAgentFilter(''); }} className="filter-select-custom">
              <option value="">All Teams</option>
              {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
            </select>
          </div>
          {/* Agent dropdown — filtered by selected team */}
          <div className="filter-select-wrapper">
            <label className="form-label">Agent</label>
            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="filter-select-custom">
              <option value="">All Agents</option>
              {(teamFilter ? agents.filter(a => Number(a.teamId) === Number(teamFilter)) : agents)
                .map((a) => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}
            </select>
          </div>
        </>
      )}
      {/* Disposition filter */}
      <div className="filter-select-wrapper">
        <label className="form-label">Disposition</label>
        <select value={dispositionFilter} onChange={(e) => setDispositionFilter(e.target.value)} className="filter-select-custom">
          <option value="">All Dispositions</option>
          {DISPOSITION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      {/* Date From */}
      <div className="filter-select-wrapper">
        <label className="form-label">Date From</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="filter-select-custom" />
      </div>
      {/* Date To */}
      <div className="filter-select-wrapper">
        <label className="form-label">Date To</label>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="filter-select-custom" />
      </div>
    </div>
  </div>

  {/* Error */}
  {error && <div className="error-box">{error}</div>}

  {/* Table */}
  {loading ? (
    <div className="text-center p-8"><p>Loading call dispositions...</p></div>
  ) : (
    <>
      <CallDispositionList
        dispositions={dispositions}
        canViewAll={canViewAll}
        onEdit={(callId) => setEditModalId(callId)}
        onDelete={handleDeleteDisposition}
      />
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="pagination-btn">Previous</button>
          <div className="pagination-info">Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total: {totalItems})</div>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="pagination-btn">Next</button>
        </div>
      )}
    </>
  )}

  {/* Modals */}
  {showAddModal && (
    <AddDispositionModal
      onClose={() => setShowAddModal(false)}
      onCreated={() => { setShowAddModal(false); fetchDispositions(); }}
    />
  )}
  {editModalId !== null && (
    <EditDispositionModal
      callId={editModalId}
      onClose={() => setEditModalId(null)}
      onUpdated={() => { setEditModalId(null); fetchDispositions(); }}
    />
  )}
</div>
```

**Wrap in Suspense** (same as `FollowUpListContainer`):
```typescript
export default function CallDispositionListContainer() {
  return (
    <Suspense fallback={<div className="text-center p-8"><p>Loading...</p></div>}>
      <CallDispositionListContainerContent />
    </Suspense>
  );
}
```

---

#### Step F5 — Page (`src/app/call-dispositions/page.tsx`)

Create this file.

```typescript
import { Metadata } from 'next';
import CallDispositionListContainer from '../../components/CallDispositionListContainer';

export const metadata: Metadata = {
  title: 'Call Dispositions | JD CRM',
  description: 'Track inbound call outcomes and agent call dispositions.',
};

export default function CallDispositionsPage() {
  return <CallDispositionListContainer />;
}
```

---

#### Step F6 — Middleware (`src/middleware.ts`)

Add the `/call-dispositions` route to `routePermissionMap`:
```typescript
'/call-dispositions': 'call-dispositions:view',
```

Add a new `else if` branch in the route matching block (after the `/follow-ups` block):
```typescript
else if (matchedPath === '/call-dispositions') {
  const canView   = hasPermission(userPermissions, 'call-dispositions:view');
  const canCreate = hasPermission(userPermissions, 'call-dispositions:create');
  if (!canView && !canCreate) {
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }
}
```

---

#### Step F7 — Sidebar (`src/components/Sidebar.tsx`)

After the Follow Ups nav link block, add a new nav link:
```tsx
{(hasPermission(permissions, 'call-dispositions:view') || hasPermission(permissions, 'call-dispositions:create')) && (
  <li>
    <Link href="/call-dispositions" className={...}>
      Call Dispositions
    </Link>
  </li>
)}
```
Use the same `className` pattern (active/inactive detection) as the existing Follow Ups and other nav links.

---

#### Step F8 — Navbar (`src/components/Navbar.tsx`)

After the Follow Ups pill/link, add:
```tsx
{(hasPermission(permissions, 'call-dispositions:view') || hasPermission(permissions, 'call-dispositions:create')) && (
  <Link href="/call-dispositions" className={...}>
    Call Dispositions
  </Link>
)}
```

---

- [ ] Run unit tests — **confirm GREEN.**

---

### Verification Chain

- [ ] Admin logs in → "Call Dispositions" link visible in Sidebar and Navbar → navigates to `/call-dispositions` → page loads → table visible with columns: Date | Customer Phone | Customer Name | Agent Name | Disposition | Actions → Center (Team) and Agent filter dropdowns visible → "Add Disposition" button and "Export to Excel" button in top-right.
- [ ] Admin clicks "Add Disposition" → modal opens over the page, background does NOT scroll → enters phone `5551234567` → blurs field → phone auto-formats to `555-123-4567` → leaves Customer Name blank → selects "Spam Call" from dropdown → clicks "Save Disposition" → modal closes → new record appears at top of table with empty Customer Name cell showing "—".
- [ ] Admin clicks Edit on that record → Edit modal opens pre-filled → changes disposition to "Wrong Number" → saves → modal closes → list updates with new disposition, scroll position unchanged.
- [ ] Admin clicks Delete on a record → inline "Confirm? Yes / Cancel" appears → clicks "Yes" → record removed from table.
- [ ] Admin clicks "Export to Excel" with current filters applied → browser downloads `call-dispositions-export.xlsx` → file contains columns: Date (EST), Customer Phone, Customer Name, Agent Name, Disposition → rows match the current filtered view.
- [ ] Agent (only `call-dispositions:create`) logs in → navigates to `/call-dispositions` → sees only own records → table has columns: Date | Customer Phone | Customer Name | Disposition | Actions (no Agent Name, no Delete button) → Center/Agent filters NOT shown → "Export to Excel" button NOT shown → clicks "Add Disposition" → modal opens → saves → own record appears.
- [ ] User with neither permission navigates to `/call-dispositions` → redirected to `/access-denied`. ✅ Done.

---

## Work Item W-3302 — Follow-Up Status Dropdown Update

### Goal

Replace the current 12-item follow-up `status` dropdown with a new 14-item list. No database schema change is needed — the column is `varchar(50)` and stores free strings.

**Values being removed:** `Wrong Number`, `Spanish`
**Values being added:** `Comparing Prices`, `Needs More Time`, `Price Quoted`, `Waiting for Payment`

**New list (in display order):**
```
No Answer | Busy | Voicemail | Call Back Later | Interested | Not Interested |
Waiting for Paycheck | Comparing Prices | Needs More Time | Price Quoted |
Waiting for Payment | Sale Closed | Purchased Elsewhere | Price Too High
```

### Approach

Update the `STATUS_OPTIONS` array in three UI files. Update test assertions that reference the removed values.

---

- [ ] **RED — Unit Tests:**
  - [ ] Test: In `AddFollowUpForm`, the status dropdown option "Comparing Prices" exists → **Run — confirm RED.**
  - [ ] Test: In `AddFollowUpForm`, the status dropdown option "Wrong Number" does NOT exist → **Run — confirm RED.**
  - [ ] Test: In `FollowUpListContainer` filter dropdown, "Price Quoted" is an option → **Run — confirm RED.**
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (3 files):**

  - [ ] **[`src/components/FollowUpListContainer.tsx`]** — Replace the `STATUS_OPTIONS` constant (currently lines 14–27) with:
    ```typescript
    const STATUS_OPTIONS = [
      'No Answer',
      'Busy',
      'Voicemail',
      'Call Back Later',
      'Interested',
      'Not Interested',
      'Waiting for Paycheck',
      'Comparing Prices',
      'Needs More Time',
      'Price Quoted',
      'Waiting for Payment',
      'Sale Closed',
      'Purchased Elsewhere',
      'Price Too High',
    ];
    ```

  - [ ] **[`src/components/AddFollowUpForm.tsx`]** — Replace the `STATUS_OPTIONS` constant (currently lines 21–34) with the same 14-item list above.

  - [ ] **[`src/components/EditFollowUpForm.tsx`]** — Find the status options array and replace with the same 14-item list.

  - [ ] **[Tests]** In `src/tests/AddFollowUpForm.test.tsx`, `src/tests/FollowUpList.test.tsx`, `src/tests/followup.service.test.ts`, and `src/tests/followups.test.ts`: search for any assertion that uses `'Wrong Number'` or `'Spanish'` as a valid status value. Replace with `'No Answer'` or any other value from the new list.

  - [ ] Run unit tests — **confirm GREEN.**

- [ ] **Verification chain:**
  - Agent opens Add Follow-Up form → status dropdown shows 14 items starting with "No Answer" → "Wrong Number" and "Spanish" are absent → "Comparing Prices", "Needs More Time", "Price Quoted", "Waiting for Payment" are present → saves a follow-up with status "Comparing Prices" → record appears in list → admin filters by "Comparing Prices" → correct records returned. ✅ Done.

---

## File Impact Summary

### New Files

| File | Purpose |
|------|---------|
| `prisma/migrations/<timestamp>_add_call_dispositions_table/migration.sql` | Prisma-generated migration for the new table |
| `src/types/callDisposition.ts` | TypeScript types and `DISPOSITION_OPTIONS` constant |
| `src/repository/callDisposition.repository.ts` | DB layer: findAll, findAll_noLimit, findById, create, update, remove |
| `src/service/callDisposition.service.ts` | Business logic: permission checks, agent scoping, phone formatting, validation |
| `src/app/api/call-dispositions/route.ts` | GET (list) + POST (create) |
| `src/app/api/call-dispositions/[id]/route.ts` | GET (single) + PATCH (update) + DELETE |
| `src/app/api/call-dispositions/export/route.ts` | GET — Excel export (admin only) |
| `src/components/AddDispositionModal.tsx` | Portal modal for creating a new disposition |
| `src/components/EditDispositionModal.tsx` | Portal modal for editing an existing disposition |
| `src/components/CallDispositionList.tsx` | Table presentation component |
| `src/components/CallDispositionListContainer.tsx` | Client component: state, filters, fetch, pagination, modals |
| `src/app/call-dispositions/page.tsx` | Server page component |
| `src/tests/callDispositions.test.ts` | Integration tests |
| `src/tests/CallDispositionList.test.tsx` | Table component unit tests |
| `src/tests/AddDispositionModal.test.tsx` | Add modal unit tests |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `CrmCallDispositions` model + reverse relations on `Users` and `CrmTeams` |
| `seed.sql` | Permissions 60 & 61 added; assigned to Super Admin, Admin, and Agent roles |
| `src/middleware.ts` | `/call-dispositions` added with dual-permission handler |
| `src/components/Sidebar.tsx` | Call Dispositions nav link added |
| `src/components/Navbar.tsx` | Call Dispositions nav link added |
| `src/components/FollowUpListContainer.tsx` | `STATUS_OPTIONS` array updated (14 items) |
| `src/components/AddFollowUpForm.tsx` | `STATUS_OPTIONS` array updated (14 items) |
| `src/components/EditFollowUpForm.tsx` | Status dropdown options updated (14 items) |
| `src/tests/AddFollowUpForm.test.tsx` | Status assertions updated to new list |
| `src/tests/FollowUpList.test.tsx` | Status assertions updated |
| `src/tests/followup.service.test.ts` | Status assertions updated |
| `src/tests/followups.test.ts` | Status assertions updated |
