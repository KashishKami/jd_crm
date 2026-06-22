I'm migrating a PHP CRM system to a Next.js TypeScript monolith. 
All planning is already done. Before you do anything, read these 
files in this exact order:

1. CONTEXT/project_data.md  
   → Project metadata, tech stack decisions, permission codes, status enums.

2. CONTEXT/database_schema.md  
   → Full schema for all tables + the authoritative Prisma schema to use.

3. CONTEXT/local_setup.md  
   → Docker Compose config and how to initialize the fresh database locally.

4. CONTEXT/decision_log.md  
   → Log of architectural design decisions and deviations from the legacy system.

5. CONTEXT/current_state.md  
   → Migration phase tracker and TDD checklists. This is your source of truth 
     for what's done and what's next.

6. CONTEXT/TDD_INSTRUCTION_GUIDE.md  
   → The checklist format all implementation work must follow.

After reading all six files:
- Confirm you understand the stack (Next.js 16 App Router, TypeScript, 
  Prisma, MySQL, NextAuth.js).
- Check CONTEXT/current_state.md to identify the first PENDING phase.
- Begin executing that phase's checklist exactly as described, following 
  the TDD format from CONTEXT/TDD_INSTRUCTION_GUIDE.md.
- As you complete checklist items, update CONTEXT/current_state.md to mark 
  them [x] done.
- Do not skip ahead to a later phase until all items in the current phase 
  are checked off.

The original PHP source code is in crm_php/ if you need to reference 
the original business logic for any phase.
