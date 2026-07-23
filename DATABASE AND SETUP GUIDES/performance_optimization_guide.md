# Performance Optimization Guide: Next.js & Server-Side Data Access

This guide explains standard web performance issues that arise when migrating or building Next.js TypeScript monoliths. It details why certain data fetching patterns slow down page loads, how React Server Components (RSC) solve this, and how to apply database indexing and pre-fetching strategies.

---

## 1. The Anti-Pattern: Local HTTP loopback fetches (`fetch`)

### The Problem
When building client-side SPAs (like legacy React/Vite applications), pages run inside the user's browser. To fetch data, they make HTTP network requests to backend API endpoints (e.g. `fetch('/api/orders')`).

When developers migrate to Next.js App Router, they often carry over this pattern. If a **Server Component** (which runs strictly on the server backend) performs an HTTP request to its own local APIs (e.g., `fetch('http://localhost:3000/api/orders')`), this is called a **local HTTP loopback fetch**.

```
[Server Component Rendering]
           │
           ▼  (Makes HTTP request to localhost)
[Next.js Internal Routing / Middleware / Authentication]
           │
           ▼  (Executes API Controller)
[Database Query via Prisma / SQL]
           │
           ▼  (Serializes JSON response)
[HTTP Network Response]
           │
           ▼  (Deserializes JSON response)
[Server Component Finishes Rendering]
```

### Why it causes latency:
1. **Network & Socket Overhead**: Every local HTTP fetch requires DNS resolution, TCP handshakes, and socket allocations on the localhost port loopback.
2. **Cascading Render Blocks**: Node.js runs on a single event-loop thread. While it waits for the HTTP request to loop back and execute the API controller, it suspends rendering the page.
3. **Double Session Parsing**: NextAuth or custom session tokens inside cookies must be read, decrypted, and re-authenticated on the incoming API request, doubling authentication latency.

### The Correct Pattern: Direct Database/Service Calls
Since Server Components run on the server, you should query the database directly using repository functions, Prisma models, or services.

```
[Server Component Rendering]
           │
           ▼  (Direct function call)
[Repository / Database Query via Prisma]
           │
           ▼  (Returns typed objects)
[Server Component Finishes Rendering]
```

#### Code Comparison:
*❌ **Bad (HTTP Fetch in Server Component):***
```typescript
// Inside src/app/orders/[id]/page.tsx
const res = await fetch(`http://localhost:3000/api/orders/${id}/audit-log`, {
  headers: { cookie }
});
const auditLogs = await res.json();
```

*✅ **Good (Direct Repository Query):***
```typescript
// Inside src/app/orders/[id]/page.tsx
import { getOrderAuditLogs } from '@/repository/order.repository';
const auditLogs = await getOrderAuditLogs(orderId);
```

---

## 2. Client-Side Request Waterfalling

### The Problem
When page layouts are loaded entirely inside a **Client Component** (marked with `'use client'`), the server renders an empty shell with loading spinners. Once the browser receives and loads the JS bundle, it launches multiple asynchronous fetches in parallel.

For example, opening a list page triggers:
1. `fetch('/api/agents')`
2. `fetch('/api/teams')`
3. `fetch('/api/orders/pending-counts')`
4. `fetch('/api/orders?page=1')`

If these API routes are heavy, the user is left waiting for multiple spinners to resolve before they can interact with the page. This is known as **waterfalling**.

### The Solution: Server-Side Pre-fetching (SSR)
Next.js App Router allows us to fetch initial page data (like configurations, lists, and dropdown options) directly from the database on the server, and pass it down as props to the Client Component.

```typescript
// src/app/orders/page.tsx (Server Component)
import { getActiveAgents } from '@/repository/agent.repository';
import { getOrders } from '@/repository/order.repository';
import OrderListContainer from '@/components/OrderListContainer';

export default async function OrdersPage() {
  // Query DB directly in parallel on the server
  const [agents, orders] = await Promise.all([
    getActiveAgents(),
    getOrders({ page: 1, limit: 20 })
  ]);

  return <OrderListContainer initialAgents={agents} initialOrders={orders} />;
}
```

---

## 3. Database Bottlenecks & Missing Indexes

### The Problem
Even if you query repositories directly, page loads will be slow if the database has to execute heavy operations across large datasets.
* In dashboard widgets or pipeline backlogs (e.g. `getPendingCounts`), queries do complex group-by aggregations and date filtering (`order_date >= '2026-07-01'`).
* Without database **indexes** on columns like `sale_status`, `order_status`, `order_sales_agent_id`, or `order_date`, the database performs a **Full Table Scan** (evaluating every single order record sequentially).

### The Solution: Database Indexing
Adding indexes changes the query search complexity from $O(N)$ (linear search) to $O(\log N)$ (binary search). 

Make sure to index:
1. **Foreign Keys**: Column IDs used in joins (e.g., `order_sales_agent_id`, `order_vendor_id`).
2. **Status Enums**: Status fields used for aggregations (e.g., `sale_status`, `order_status`).
3. **Filtering Criteria**: Date Ranges or Boolean flags (e.g., `order_date`, `order_created_date`).

#### SQL Index Example:
```sql
CREATE INDEX idx_orders_sales_agent ON crm_orders (order_sales_agent_id);
CREATE INDEX idx_orders_status ON crm_orders (order_status);
CREATE INDEX idx_orders_date ON crm_orders (order_date);
```

---

## 4. Sequential Query Waterfalling in Server-Side Rendering & APIs

### The Problem
Even when you optimize code to call the database directly on the server (avoiding HTTP loopbacks), performance can still degrade if you execute multiple independent database queries **sequentially** using separate `await` statements. 

When your application is deployed to cloud platforms (like Vercel serverless functions) and your database is hosted on a separate managed database server, there is a round-trip network latency (e.g., 50ms–100ms) for every database transaction.

Running queries sequentially forces your serverless function to wait for each query to finish before sending the next one:

```
[Serverless Function]                       [Database Server]
        │                                           │
        │─── Query 1 (Find Order) ─────────────────>│  (80ms latency)
        │<── Return Order Data ─────────────────────│
        │                                           │
        │─── Query 2 (Fetch Sale History) ─────────>│  (80ms latency)
        │<── Return History Data ───────────────────│
        │                                           │
        │─── Query 3 (Fetch Audit Logs) ───────────>│  (80ms latency)
        │<── Return Audit Logs ─────────────────────│
        ▼
   (Total network wait time: 240ms)
```

### The Solution: Parallel Query Execution (`Promise.all`)
Since these queries are independent and do not rely on each other's outputs, they should be fired concurrently. Using JavaScript's native `Promise.all` allows the runtime to send all queries to the database concurrently, reducing the total wait time to just the duration of the single slowest query:

```
[Serverless Function]                       [Database Server]
        │                                           │
        │─── Query 1 (Find Order) ─────────────────>│
        │─── Query 2 (Fetch Sale History) ─────────>│  (Executed in parallel)
        │─── Query 3 (Fetch Audit Logs) ───────────>│
        │                                           │
        │<── Return All Results Concurrently ───────│  (80ms total latency)
        ▼
   (Total network wait time: 80ms)
```

#### Code Comparison:

*❌ **Bad (Sequential Awaits):***
```typescript
// Each await blocks the thread, causing sequential network round-trips
const order = await prisma.crmOrders.findUnique({ where: { crmOrderId } });
const saleHistory = await prisma.crmSaleStatusHistory.findMany({ where: { orderId } });
const auditLogs = await prisma.crmOrderAuditLogs.findMany({ where: { orderId } });
```

*✅ **Good (Parallel Promise.all):***
```typescript
// All queries execute concurrently, resolving in a single round-trip time
const [order, saleHistory, auditLogs] = await Promise.all([
  prisma.crmOrders.findUnique({ where: { crmOrderId } }),
  prisma.crmSaleStatusHistory.findMany({ where: { orderId } }),
  prisma.crmOrderAuditLogs.findMany({ where: { orderId } }),
]);
```

