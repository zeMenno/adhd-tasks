# ADHDTasks — Compleet Bouwplan (A tot Z)

> Tech stack: Next.js 15 · Neon (Postgres) · Drizzle ORM · Tailwind + ShadCN · Vercel · Web Push

Elk stap bevat: **wat** je bouwt, **waarom**, en een **AI-prompt** die je 1-op-1 in Claude Code of Cursor kunt plakken.

---

## Fase 1 — Fundament

---

### Stap 1 — Next.js projectsetup

**Wat:** Nieuw Next.js 15 project aanmaken met Tailwind CSS en ShadCN UI.

**Waarom:** Dit is de basis van de hele applicatie. We kiezen voor de App Router (Next.js 15) omdat we Server Actions gaan gebruiken voor formulieren en API-aanroepen zonder aparte route-handlers.

---

**AI-prompt:**

```
Create a new Next.js 15 project called "adhd-tasks" with the following setup:

1. Use `npx create-next-app@latest adhd-tasks` with these options:
   - TypeScript: yes
   - ESLint: yes
   - Tailwind CSS: yes
   - src/ directory: no
   - App Router: yes
   - Import alias: yes (@/*)

2. Install and set up the Vercel CLI globally, then add the Vercel plugin:
   ```
   npm install -g vercel
   vercel plugins add vercel/vercel-plugin
   ```
   After installation, link the project to Vercel:
   ```
   vercel link
   ```
   Follow the prompts: create a new project called "adhd-tasks" under your Vercel account.
   This creates a `.vercel/` folder with your project ID — commit the `project.json` but NOT the `.vercel/` folder itself (add it to .gitignore except for `project.json`).

3. After creation, install and initialize ShadCN UI:
   - Run `npx shadcn@latest init`
   - Style: Default
   - Base color: Slate
   - CSS variables: yes

4. Install these additional packages:
   - `npm install drizzle-orm @neondatabase/serverless`
   - `npm install -D drizzle-kit`
   - `npm install web-push`
   - `npm install @types/web-push -D`
   - `npm install date-fns`
   - `npm install zod`

5. Add the following ShadCN components:
   - `npx shadcn@latest add button card badge dialog sheet toast progress`

6. Create the following folder structure inside the project root:
   ```
   app/
     (auth)/
       pin/
     (app)/
       today/
       tasks/
       rewards/
       stats/
   components/
     ui/ (managed by ShadCN)
     tasks/
     notifications/
     layout/
   lib/
     db/
       schema.ts
       index.ts
     auth/
     notifications/
     tasks/
   ```

7. Add a `.env.local` file with these placeholder variables:
   ```
   DATABASE_URL=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   VAPID_PUBLIC_KEY=
   VAPID_PRIVATE_KEY=
   VAPID_EMAIL=
   SESSION_SECRET=
   CRON_SECRET=
   ```
   Then pull any already-set Vercel env vars (if any) with:
   ```
   vercel env pull .env.local
   ```
   This syncs your local .env.local with whatever is set in the Vercel dashboard.

8. Update `.gitignore` to include:
   ```
   .env.local
   .vercel
   ```

9. Update `next.config.ts` to enable PWA support later by adding:
   ```ts
   const nextConfig = {
     experimental: {
       serverActions: { allowedOrigins: ['localhost:3000'] }
     }
   }
   export default nextConfig
   ```

Report what was created, confirm the folder structure exists, and confirm `vercel link` succeeded.
```

---

### Stap 2 — Neon database verbinden

**Wat:** Neon Postgres database aanmaken en verbinden met de app via Drizzle ORM.

**Waarom:** Neon is een serverless Postgres database die perfect werkt met Vercel. Het heeft een gratis tier, automatische scaling, en ondersteunt connection pooling voor serverless functions.

---

**AI-prompt:**

```
Set up the Neon database connection for this Next.js project.

Context:
- We use Neon (serverless Postgres) with Drizzle ORM
- The project is already linked to Vercel via `vercel link` (done in Step 1)
- The DATABASE_URL will be set via Vercel CLI — the user has already created a Neon database at neon.tech and has the connection string ready

1. Add the DATABASE_URL to Vercel via CLI (run for all three environments):
   ```
   vercel env add DATABASE_URL production
   vercel env add DATABASE_URL preview
   vercel env add DATABASE_URL development
   ```
   Paste the Neon connection string when prompted (same value for all three).

   Then pull it to your local .env.local:
   ```
   vercel env pull .env.local
   ```

1. Create `lib/db/index.ts`:
```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

2. Create `lib/db/schema.ts` with an empty placeholder:
```ts
// Schema will be added in the next step
export {}
```

3. Create `drizzle.config.ts` in the project root:
```ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

4. Add these scripts to `package.json`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:push": "drizzle-kit push"
```

5. Add a `lib/db/client.ts` for reuse:
```ts
export { db } from './index'
```

Do not run migrations yet — the schema hasn't been defined. Confirm all files are created.
```

---

### Stap 3 — Database schema

**Wat:** Alle tabellen definiëren in Drizzle schema en migreren naar Neon.

**Waarom:** Het schema is de ruggengraat van de app. We definiëren het volledig in één stap zodat we geen breaking migrations krijgen later.

---

**AI-prompt:**

```
Define the complete database schema in `lib/db/schema.ts` using Drizzle ORM with PostgreSQL.

Create the following tables:

1. **households** — one per app instance
   - id (uuid, primary key, default random)
   - name (text, not null)
   - createdAt (timestamp, default now)

2. **users** — 2-3 people per household
   - id (uuid, primary key, default random)
   - householdId (uuid, foreign key → households.id, cascade delete)
   - name (text, not null)
   - pin (text, not null) — hashed 4-digit PIN
   - color (text, not null) — hex color for visual identity, e.g. "#6366f1"
   - avatar (text) — emoji avatar, nullable
   - totalPoints (integer, not null, default 0)
   - createdAt (timestamp, default now)

3. **devices** — for push notifications
   - id (uuid, primary key, default random)
   - userId (uuid, foreign key → users.id, cascade delete)
   - endpoint (text, not null)
   - p256dh (text, not null)
   - auth (text, not null)
   - createdAt (timestamp, default now)

4. **tasks** — task definitions (templates for recurring tasks)
   - id (uuid, primary key, default random)
   - householdId (uuid, foreign key → households.id, cascade delete)
   - title (text, not null)
   - assignedUserId (uuid, foreign key → users.id, set null on delete, nullable)
   - ownerUserId (uuid, foreign key → users.id, set null on delete, nullable)
   - basePoints (integer, not null, default 10)
   - penaltyPerDay (integer, not null, default 2)
   - requiresApproval (boolean, not null, default false)
   - recurrenceType (text, not null) — enum: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
   - recurrenceDayOfWeek (integer, nullable) — 0-6 for weekly/biweekly tasks
   - recurrenceDayOfMonth (integer, nullable) — 1-31 for monthly tasks
   - isActive (boolean, not null, default true)
   - createdAt (timestamp, default now)

5. **task_instances** — actual instances of tasks for a specific date
   - id (uuid, primary key, default random)
   - taskId (uuid, foreign key → tasks.id, cascade delete)
   - assignedUserId (uuid, foreign key → users.id, set null on delete, nullable)
   - dueDate (date, not null) — the original due date
   - status (text, not null, default 'todo') — enum: 'todo' | 'done' | 'approved' | 'completed'
   - completedAt (timestamp, nullable)
   - approvedAt (timestamp, nullable)
   - approvedByUserId (uuid, foreign key → users.id, set null on delete, nullable)
   - earnedPoints (integer, nullable) — calculated at completion time
   - daysOverdue (integer, not null, default 0)
   - createdAt (timestamp, default now)

6. **rewards** — items in the reward store
   - id (uuid, primary key, default random)
   - householdId (uuid, foreign key → households.id, cascade delete)
   - title (text, not null)
   - description (text, nullable)
   - pointsCost (integer, not null)
   - isActive (boolean, not null, default true)
   - createdAt (timestamp, default now)

7. **transactions** — point redemptions
   - id (uuid, primary key, default random)
   - userId (uuid, foreign key → users.id, cascade delete)
   - rewardId (uuid, foreign key → rewards.id, set null on delete, nullable)
   - taskInstanceId (uuid, foreign key → task_instances.id, set null on delete, nullable)
   - points (integer, not null) — positive = earned, negative = spent
   - description (text, not null)
   - createdAt (timestamp, default now)

Use proper Drizzle relations between all tables.

After defining the schema, run:
```
npm run db:push
```

This pushes the schema directly to Neon without generating migration files (fine for early development). Confirm all tables were created successfully.
```

---

## Fase 2 — Authenticatie & Household

---

### Stap 4 — OTP PIN authenticatie

**Wat:** Sessie-gebaseerde authenticatie met een 4-cijferig PIN. Geen accounts, geen wachtwoorden.

**Waarom:** De app is bedoeld voor thuis gebruik op bekende apparaten. Een PIN is laagdrempelig en past bij de ADHD-focus van minimale wrijving. We bewaren de sessie in een HTTP-only cookie.

---

**AI-prompt:**

```
Implement PIN-based session authentication for the ADHDTasks app.

Requirements:
- 4-digit PIN per user (stored as bcrypt hash in the database)
- Session stored in an HTTP-only cookie (no JWT, no external auth library)
- Session contains: userId, householdId, userName
- Session expires after 30 days
- No account creation flow — household is set up separately (next step)

1. Install dependencies:
   ```
   npm install bcryptjs jose
   npm install @types/bcryptjs -D
   ```

2. Create `lib/auth/session.ts`:
   - Function `createSession(userId: string)`: creates a signed session cookie using `jose` (JWS, HS256) with the user's id, householdId, name, and expiry. Secret key from `process.env.SESSION_SECRET`.
   - Function `getSession(request: Request)`: reads and verifies the cookie, returns the session payload or null.
   - Function `requireSession(request: Request)`: like getSession but redirects to /pin if not authenticated.
   - Cookie name: `adhd_session`
   - Cookie options: httpOnly, secure (in production), sameSite: 'lax', maxAge: 30 days

3. Add `SESSION_SECRET` to `.env.local` (generate a random 32-char string as placeholder comment).

4. Create `lib/auth/pin.ts`:
   - Function `hashPin(pin: string)`: bcrypt hash with salt rounds 10
   - Function `verifyPin(pin: string, hash: string)`: returns boolean

5. Create the PIN login page at `app/(auth)/pin/page.tsx`:
   - Shows the household name at the top
   - Shows all users as large cards with their name, avatar emoji, and color
   - When a user card is clicked, shows a 4-digit PIN pad (numeric buttons 0-9 + delete + confirm)
   - On submit: POST to `/api/auth/login`
   - On success: redirect to `/today`
   - On error: shake animation + "Verkeerde PIN" message

6. Create `app/api/auth/login/route.ts` (POST):
   - Accepts `{ userId, pin }`
   - Looks up user, verifies PIN with bcrypt
   - Creates session cookie
   - Returns `{ success: true }` or `{ error: 'Verkeerde PIN' }`

7. Create `app/api/auth/logout/route.ts` (POST):
   - Clears the session cookie
   - Redirects to /pin

8. Create a middleware `middleware.ts` in the project root:
   - Protects all routes under `/(app)/*`
   - Redirects to /pin if no valid session
   - Redirects to /setup if no household exists yet

Add `SESSION_SECRET` to the `.env.local` placeholder list. Do not implement the /setup page yet.
```

---

### Stap 5 — Household & gebruikers setup

**Wat:** Eenmalige setup flow voor het aanmaken van het huishouden en de gebruikers.

**Waarom:** De eerste keer dat de app wordt geopend is er nog geen household. Deze flow loopt één keer en is daarna niet meer toegankelijk.

---

**AI-prompt:**

```
Build the one-time household setup flow for ADHDTasks.

This flow runs once when no household exists in the database. After completion, it's no longer accessible.

1. Create `app/(auth)/setup/page.tsx` — a multi-step wizard:

   **Step 1 — Household name**
   - Single text input: "Wat is de naam van jullie huishouden?" (e.g. "Familie De Vries")
   - Large, centered input with a "Verder →" button

   **Step 2 — Add users (2-3)**
   - Shows already-added users as cards
   - Form to add a user:
     - Name (text input)
     - Avatar (emoji picker — show 12 preset emoji options: 🦁 🐯 🐻 🦊 🐸 🐙 🦋 🌟 🚀 🎸 🍕 🎮)
     - Color (color picker — show 8 preset colors as circles)
     - PIN (4-digit numeric input, shown as dots)
     - Confirm PIN
   - "Gebruiker toevoegen" button
   - Minimum 1 user, maximum 3 users
   - "Klaar →" button to proceed (visible after at least 1 user added)

   **Step 3 — Confirmation**
   - Shows household name + all users as a summary
   - "Start de app →" button

2. Create `app/api/setup/route.ts` (POST):
   - Accepts `{ householdName, users: [{ name, avatar, color, pin }] }`
   - Validates: household name not empty, 1-3 users, each user has valid 4-digit pin
   - Creates household record
   - Creates user records with hashed PINs (use `hashPin` from lib/auth/pin.ts)
   - Returns `{ success: true, householdId }`
   - Returns 409 if household already exists

3. Create `lib/db/queries/household.ts`:
   - `getHousehold()`: returns the first (and only) household, or null
   - `getUsers(householdId: string)`: returns all users for the household
   - `getUserById(userId: string)`: returns a single user with their household

4. Update the middleware from Step 4:
   - If no household exists → redirect to /setup
   - If household exists but no session → redirect to /pin
   - If household exists and session valid → allow through to /(app)/*

5. Style: full-screen centered layout, large touch targets (min 48px height), smooth step transitions using opacity/translate CSS.
```

---

## Fase 3 — Task Engine

---

### Stap 6 — Recurrence engine (kritisch module)

**Wat:** De logica die bepaalt welke taken op welke dag zichtbaar zijn. Dit is de meest complexe module van de app en wordt volledig los gebouwd en getest voordat het aan de UI wordt gekoppeld.

**Waarom:** Terugkerende taken met overdue-logica zijn gevoelig voor edge cases: wat als een wekelijkse taak 3 dagen over tijd is? Wordt er dan een nieuwe instantie aangemaakt of wordt de oude bijgewerkt? Door deze logica volledig geïsoleerd te bouwen met tests, voorkomen we dat bugs later in de UI verborgen zitten.

**De regels:**
- Een taak-instantie wordt aangemaakt voor de due date
- Als de instantie niet op tijd klaar is, blijft hij staan (hij "schuift" mee naar vandaag)
- De `daysOverdue` teller loopt op per dag
- Een nieuwe instantie voor de volgende recurrenceperiode wordt pas aangemaakt nadat de huidige is goedgekeurd/afgerond
- Eenmalige taken (`once`) krijgen nooit een nieuwe instantie

---

**AI-prompt:**

```
Build the recurrence engine for ADHDTasks as an isolated, fully tested module.

This is the most critical piece of the app. Build it in `lib/tasks/recurrence.ts` and test it in `lib/tasks/recurrence.test.ts`.

**Rules to implement:**

1. A task instance is created for its due date.
2. If the instance is not completed by end of day, it stays visible the next day — it does NOT get a new instance. Instead, `daysOverdue` increments by 1 each passing day.
3. A new recurring instance is only created after the current one reaches status 'completed' (or 'approved' if approval is required).
4. For 'once' tasks: no new instance ever.
5. For 'daily' tasks: new instance due the next day after completion.
6. For 'weekly' tasks: new instance due 7 days after the original due date.
7. For 'biweekly' tasks: new instance due 14 days after the original due date.
8. For 'monthly' tasks: new instance due 1 month after the original due date (same day of month).

**Create `lib/tasks/recurrence.ts`:**

```ts
import { addDays, addWeeks, addMonths, startOfDay, differenceInCalendarDays } from 'date-fns'

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly'

export function getNextDueDate(
  recurrenceType: RecurrenceType,
  originalDueDate: Date
): Date | null {
  // Returns the next due date, or null for 'once' tasks
}

export function calculateDaysOverdue(dueDate: Date, today: Date): number {
  // Returns how many days past due. 0 if not overdue.
}

export function calculateEarnedPoints(
  basePoints: number,
  penaltyPerDay: number,
  daysOverdue: number
): number {
  // Returns max(0, basePoints - penaltyPerDay * daysOverdue)
  // Points can never go below 0
}

export function shouldCreateNewInstance(
  recurrenceType: RecurrenceType,
  currentStatus: 'todo' | 'done' | 'approved' | 'completed',
  requiresApproval: boolean
): boolean {
  // Returns true if a new instance should be spawned
  // For requiresApproval=true: only after 'approved' or 'completed'
  // For requiresApproval=false: after 'done' or 'completed'
  // Never for 'once' tasks
}
```

**Create `lib/tasks/recurrence.test.ts`** using Vitest:

Write tests for:
- `getNextDueDate` for all 5 recurrence types
- `calculateDaysOverdue` for: same day (0), 1 day late (1), 5 days late (5)
- `calculateEarnedPoints`: normal (10 - 0*2 = 10), 2 days overdue (10 - 2*2 = 6), so overdue penalty never goes below 0 (10 - 10*2 = 0 not -10)
- `shouldCreateNewInstance`: all combinations of status + requiresApproval + recurrenceType

Install vitest: `npm install -D vitest @vitejs/plugin-react`
Add to `package.json`: `"test": "vitest"`

Run `npm test` and confirm all tests pass before continuing.
```

---

### Stap 7 — Task instance scheduler

**Wat:** De server-side logica die dagelijks controleert welke instanties aangemaakt of bijgewerkt moeten worden.

**Waarom:** Iemand moet `daysOverdue` bijhouden en nieuwe instanties aanmaken. Dit doen we via een Vercel Cron job die elke dag om 00:01 draait.

---

**AI-prompt:**

```
Build the task instance scheduler for ADHDTasks.

This module runs daily (via Vercel Cron) and:
1. Updates `daysOverdue` for all overdue task instances (status = 'todo' or 'done')
2. Creates new instances for recurring tasks that were just completed

**1. Create `lib/tasks/scheduler.ts`:**

```ts
import { db } from '@/lib/db'
import { taskInstances, tasks } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { 
  calculateDaysOverdue, 
  getNextDueDate, 
  shouldCreateNewInstance 
} from './recurrence'
import { startOfDay } from 'date-fns'

export async function runDailyScheduler(): Promise<{ updated: number; created: number }> {
  const today = startOfDay(new Date())
  
  // Step 1: Find all open instances where dueDate < today
  // Update their daysOverdue counter
  
  // Step 2: Find all instances that were just completed (completedAt = yesterday or earlier)
  // and where no future instance exists yet for their parent task
  // Create a new instance using getNextDueDate()
  
  return { updated: 0, created: 0 } // replace with actual counts
}
```

**2. Create `app/api/cron/daily/route.ts`:**

```ts
import { NextRequest } from 'next/server'
import { runDailyScheduler } from '@/lib/tasks/scheduler'

export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runDailyScheduler()
  console.log('[Cron] Daily scheduler result:', result)
  return Response.json({ success: true, ...result })
}
```

**3. Create `vercel.json` in the project root:**

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "1 0 * * *"
    }
  ]
}
```
This runs every day at 00:01 UTC.

**4. Add `CRON_SECRET` to `.env.local`** (placeholder — user sets a random string, same value goes in Vercel environment variables).

**5. Create `lib/tasks/queries.ts`:**

- `getTodayInstances(householdId: string, date: Date)`: returns all task instances due today or overdue, joined with their task definition and assigned user
- `getInstanceById(id: string)`: returns a single instance with full task info
- `createTaskInstance(taskId: string, dueDate: Date, assignedUserId: string)`: creates a new instance
- `completeInstance(id: string, userId: string)`: sets status to 'done', records completedAt, calculates earnedPoints using calculateEarnedPoints()
- `approveInstance(id: string, approverId: string)`: sets status to 'approved' or 'completed', records approvedAt

Implement the full body of `runDailyScheduler()` using these queries.
```

---

## Fase 4 — Core UI

---

### Stap 8 — Today view (hoofdscherm)

**Wat:** Het hoofdscherm van de app: een lijst van taken voor vandaag, gesorteerd op urgentie, met grote actieknoppen.

**Waarom:** Dit is het scherm dat gebruikers het meest zien. Het moet in één oogopslag duidelijk zijn wat er gedaan moet worden, zonder na te denken.

---

**AI-prompt:**

```
Build the main "Today" screen for ADHDTasks at `app/(app)/today/page.tsx`.

Design principles:
- Mobile-first, large touch targets (min 56px button height)
- Tasks sorted by: overdue first (most overdue at top), then by points (highest first)
- Visual urgency indicators
- Current user's name and points shown at top

**1. Create the Today page:**

Header:
- Left: household name (small text)
- Center: "Vandaag" (large)
- Right: current user's avatar + name + points badge

Points summary bar (below header):
- Show each user as a colored pill with their name + total points
- Highlight the current user

Task list:
- Empty state: "Alles gedaan voor vandaag! 🎉" with a green checkmark
- Each task card (see below)

**2. Task Card component (`components/tasks/TaskCard.tsx`):**

The card shows:
- Task title (large, bold)
- Assigned user avatar + name (top right)
- Points display:
  - If not overdue: "+10 pts" in green
  - If overdue: "+6 pts" in orange with a red "-4" penalty indicator
  - Formula: earnedPoints = basePoints - (penaltyPerDay * daysOverdue)
- Overdue badge: "⚠️ 2 dagen te laat" in red if daysOverdue > 0
- Status:
  - todo: large green "✓ Gedaan" button
  - done (awaiting approval): gray "⏳ Wacht op goedkeuring" + approve button if current user is the owner
  - approved/completed: green checkmark, grayed out

Visual states:
- Normal: white card with subtle shadow
- Overdue: left border 4px solid red
- Done: slightly faded, checkmark overlay

**3. Server component data fetching:**

Use `getTodayInstances()` from lib/tasks/queries.ts to load tasks.
Get current user from session.
Pass data to client components.

**4. Sorting logic:**
```ts
function sortTasks(instances: TaskInstance[]) {
  return instances.sort((a, b) => {
    // Completed tasks go to bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    // Most overdue first
    if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue
    // Highest points first
    return b.earnedPoints - a.earnedPoints
  })
}
```

**5. Navigation:**
- Bottom navigation bar with icons for: Today, Tasks (manage), Rewards, Stats
- Use ShadCN Sheet for mobile-friendly navigation

Use React Server Components for data fetching. Use Client Components only for interactive parts (buttons, animations).
```

---

### Stap 9 — Done & Approval flow

**Wat:** De flow wanneer een gebruiker op "Gedaan" klikt, inclusief de goedkeuringsflow door de owner.

**Waarom:** Dit is de kerninteractie van de app. Het moet snel, visueel bevredigend en foutloos werken.

---

**AI-prompt:**

```
Implement the "Done" and "Approval" flow for ADHDTasks.

**Flow:**
1. User taps "✓ Gedaan" on a task
2. If requiresApproval = false: task immediately goes to 'completed', points awarded
3. If requiresApproval = true: task goes to 'done', owner gets notified, approve button appears
4. Owner taps "Goedkeuren": task goes to 'completed', points awarded to assignee

**1. Create Server Actions in `lib/tasks/actions.ts`:**

```ts
'use server'
import { revalidatePath } from 'next/cache'

export async function markTaskDone(instanceId: string) {
  // 1. Get session (requireSession)
  // 2. Load instance + task
  // 3. Calculate daysOverdue and earnedPoints
  // 4. If requiresApproval: set status = 'done'
  //    Else: set status = 'completed', award points, create transaction record
  // 5. If recurring + !requiresApproval: call shouldCreateNewInstance, if true create next instance
  // 6. revalidatePath('/today')
}

export async function approveTask(instanceId: string) {
  // 1. Get session
  // 2. Verify current user is the ownerUserId for this task
  // 3. Set status = 'completed', approvedAt = now, approvedByUserId = current user
  // 4. Award points to assignee, create transaction record
  // 5. Call shouldCreateNewInstance → create next recurring instance if needed
  // 6. revalidatePath('/today')
}
```

**2. Update TaskCard to use these actions:**

- "✓ Gedaan" button: calls `markTaskDone(instance.id)` via form action
- "Goedkeuren" button: calls `approveTask(instance.id)` via form action (only visible to owner)
- Add optimistic UI: immediately show task as "done" while server processes

**3. Points animation:**

When a task is completed, show a floating "+10 pts" animation that flies up and fades out (CSS keyframe animation). Use a client component with `useState` triggered after the server action resolves.

**4. Transaction records:**

Every time points are awarded, create a record in the `transactions` table:
```ts
{
  userId: assignedUserId,
  taskInstanceId: instanceId,
  points: earnedPoints, // positive
  description: `Taak voltooid: ${task.title}`
}
```

**5. Error handling:**
- If user tries to complete a task not assigned to them: show toast "Dit is niet jouw taak"
- If user tries to approve their own task: show toast "Je kunt je eigen taak niet goedkeuren"
- Use ShadCN toast for all error messages
```

---

### Stap 10 — Task beheer (aanmaken & bewerken)

**Wat:** Scherm waar taken aangemaakt en beheerd worden, inclusief recurrence-instellingen.

---

**AI-prompt:**

```
Build the task management screen for ADHDTasks at `app/(app)/tasks/page.tsx`.

**1. Task list page:**
- Shows all active tasks (not instances, but task definitions)
- Grouped by recurrenceType: "Eenmalig", "Dagelijks", "Wekelijks", "Tweewekelijks", "Maandelijks"
- Each row: task title, assigned user avatar, points, penalty/day, edit button
- FAB (floating action button) "+" to create new task

**2. Task form (`components/tasks/TaskForm.tsx`):**
Opens in a ShadCN Sheet (bottom drawer on mobile).

Fields:
- Title (text, required)
- Assigned user (select from household users, or "Iedereen" for unassigned)
- Owner / approver (select from household users)
- Base points (number input, default 10, min 1, max 100)
- Penalty per day (number input, default 2, min 0, max 20)
- Requires approval (toggle switch)
- Recurrence type (segmented control: Eenmalig / Dagelijks / Wekelijks / 2-wekelijks / Maandelijks)
- If weekly/biweekly: day of week selector (Ma Di Wo Do Vr Za Zo)
- If monthly: day of month (1-28)
- Due date (date picker, only for 'once' tasks OR first occurrence for recurring)

**3. Server Actions in `lib/tasks/actions.ts`:**

```ts
export async function createTask(data: CreateTaskInput) {
  // Validate with Zod
  // Insert into tasks table
  // Create the first task_instance based on dueDate
  // revalidatePath('/tasks')
  // revalidatePath('/today')
}

export async function updateTask(taskId: string, data: UpdateTaskInput) {
  // Only update the task definition
  // Do NOT modify existing instances (they keep their original settings)
  // revalidatePath('/tasks')
}

export async function deactivateTask(taskId: string) {
  // Set isActive = false
  // Leave existing instances untouched
  // revalidatePath('/tasks')
}
```

**4. Zod schema for validation:**

```ts
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  assignedUserId: z.string().uuid().nullable(),
  ownerUserId: z.string().uuid().nullable(),
  basePoints: z.number().int().min(1).max(100),
  penaltyPerDay: z.number().int().min(0).max(20),
  requiresApproval: z.boolean(),
  recurrenceType: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly']),
  recurrenceDayOfWeek: z.number().int().min(0).max(6).nullable(),
  recurrenceDayOfMonth: z.number().int().min(1).max(28).nullable(),
  dueDate: z.string().datetime(),
})
```
```

---

## Fase 5 — Notificaties

---

### Stap 11 — Web Push setup

**Wat:** Service Worker registreren en push notificatie abonnementen opslaan per apparaat.

**Waarom:** Web Push vereist een Service Worker en VAPID keys. We zetten de volledige infrastructuur op voordat we de Vercel Cron erdoor stuurt.

---

**AI-prompt:**

```
Set up Web Push notifications for ADHDTasks.

**Important iOS note:** Web Push only works on iOS 16.4+ when the app is installed as a PWA (added to home screen). On Android and desktop it works in the browser directly. We handle this gracefully.

**1. Generate VAPID keys and push them directly to Vercel via CLI:**
```bash
npx web-push generate-vapid-keys
```
Copy the output values and add them to Vercel immediately (no manual dashboard needed):
```bash
vercel env add VAPID_PUBLIC_KEY production
vercel env add VAPID_PUBLIC_KEY preview
vercel env add VAPID_PUBLIC_KEY development

vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_PRIVATE_KEY preview
vercel env add VAPID_PRIVATE_KEY development

vercel env add VAPID_EMAIL production
vercel env add VAPID_EMAIL preview
vercel env add VAPID_EMAIL development
# Enter: mailto:your@email.com
```
Then pull to local so the app can use them:
```bash
vercel env pull .env.local
```

**2. Create `public/sw.js` (Service Worker):**

```js
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ADHDTasks', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: data.tag || 'adhd-tasks',
      data: data.url ? { url: data.url } : {},
      actions: data.actions || []
    })
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  
  if (event.action === 'done' && event.notification.data.instanceId) {
    // POST to /api/tasks/done from service worker
    event.waitUntil(
      fetch('/api/tasks/done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: event.notification.data.instanceId })
      })
    )
  }
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/today')
  )
})
```

**3. Create `lib/notifications/subscribe.ts`:**

```ts
export async function subscribeToPush(userId: string) {
  // 1. Register service worker: navigator.serviceWorker.register('/sw.js')
  // 2. Get or create push subscription: registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
  // 3. POST subscription to /api/notifications/subscribe
}
```

**4. Create `app/api/notifications/subscribe/route.ts` (POST):**
- Accepts `{ endpoint, p256dh, auth }`
- Gets userId from session
- Upserts device record in database (update if endpoint exists, insert if not)
- Returns `{ success: true }`

**5. Create `lib/notifications/send.ts`:**

```ts
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushToUser(userId: string, payload: {
  title: string
  body: string
  tag?: string
  url?: string
  actions?: { action: string; title: string }[]
  instanceId?: string
}) {
  // Load all devices for userId from database
  // For each device: webpush.sendNotification(subscription, JSON.stringify(payload))
  // If sendNotification fails with 410 Gone: delete device from database (subscription expired)
}
```

**6. Add subscription trigger to the Today page:**
- On page load (client component), call `subscribeToPush(userId)` if Notification.permission !== 'denied'
- Show a subtle "Notificaties inschakelen?" banner if permission is 'default'
```

---

### Stap 12 — Vercel Cron voor notificaties

**Wat:** Drie geplande notificatiemomenten per dag: 18:00, 19:00, en 21:00.

**Waarom:** De app stuurt adaptieve notificaties: alleen als er nog open taken zijn. Vercel Cron triggert onze API endpoints op de geplande tijden. De logica is slim: de latere notificaties bevatten urgentere taal en penalty-waarschuwingen.

**De drie fasen:**
- **18:00** — "Je hebt nog X taken vandaag"
- **19:00** — Vriendelijke herinnering
- **21:00** — Urgente waarschuwing met penalty-preview

---

**AI-prompt:**

```
Implement the three-phase adaptive notification system for ADHDTasks using Vercel Cron.

**Phase logic:**
- Phase 1 (18:00 UTC+2 = 16:00 UTC): "Reminder" — only if user has open tasks
- Phase 2 (19:00 UTC+2 = 17:00 UTC): "Friendly nudge" — only if still has open tasks
- Phase 3 (21:00 UTC+2 = 19:00 UTC): "Urgent" — only if OVERDUE tasks exist

Stop condition: if all tasks are done → send no notification for that phase.

**1. Update `vercel.json`:**

```json
{
  "crons": [
    { "path": "/api/cron/daily", "schedule": "1 0 * * *" },
    { "path": "/api/cron/notify/phase1", "schedule": "0 16 * * *" },
    { "path": "/api/cron/notify/phase2", "schedule": "0 17 * * *" },
    { "path": "/api/cron/notify/phase3", "schedule": "0 19 * * *" }
  ]
}
```

**2. Create `lib/notifications/phases.ts`:**

```ts
export type NotificationPhase = 1 | 2 | 3

export function buildNotificationPayload(
  phase: NotificationPhase,
  openCount: number,
  overdueCount: number,
  maxPenalty: number,
  instanceId?: string
) {
  if (phase === 1) {
    return {
      title: `📋 ${openCount} ${openCount === 1 ? 'taak' : 'taken'} vandaag`,
      body: 'Tik om te zien wat er nog gedaan moet worden.',
      tag: 'phase1',
      url: '/today'
    }
  }
  if (phase === 2) {
    return {
      title: '⏰ Nog even herinneren!',
      body: `Je hebt nog ${openCount} open ${openCount === 1 ? 'taak' : 'taken'}.`,
      tag: 'phase2',
      url: '/today'
    }
  }
  // Phase 3
  return {
    title: `⚠️ ${overdueCount} ${overdueCount === 1 ? 'taak is' : 'taken zijn'} te laat!`,
    body: `Je verliest al ${maxPenalty} punten. Doe het nu nog!`,
    tag: 'phase3',
    url: '/today',
    actions: instanceId ? [{ action: 'done', title: '✓ Gedaan' }] : []
  }
}
```

**3. Create `app/api/cron/notify/[phase]/route.ts`:**

```ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/notifications/send'
import { buildNotificationPayload } from '@/lib/notifications/phases'
import { getTodayInstances } from '@/lib/tasks/queries'

export async function GET(
  request: NextRequest,
  { params }: { params: { phase: string } }
) {
  // 1. Verify CRON_SECRET
  // 2. Load all households
  // 3. For each household:
  //    a. Load all users
  //    b. For each user: load their open task instances for today
  //    c. Count open tasks, overdue tasks, max penalty
  //    d. If open tasks > 0 (or phase 3: overdue > 0): send push notification
  //    e. For phase 3: include the most overdue instance's id as action data
  // 4. Return summary: { notified: number, skipped: number }
}
```

**4. Add snooze endpoint `app/api/notifications/snooze/route.ts` (POST):**
- Accepts `{ userId, minutes: 30 }`
- Store snooze expiry in a simple in-memory or DB record
- Check snooze status in phase handlers before sending
- (Simple implementation: add a `snoozedUntil` field to the users table)

Add `snoozedUntil` (timestamp, nullable) to the users table in the schema and run `npm run db:push`.
```

---

## Fase 6 — Gamificatie

---

### Stap 13 — Punten systeem & transacties

**Wat:** Het bijhouden van punten per gebruiker, inclusief een transactiegeschiedenis.

---

**AI-prompt:**

```
Implement the full points system for ADHDTasks.

The points system is already partially wired in the Done/Approval flow (Step 9). This step adds the full points dashboard and makes sure everything is consistent.

**1. Create `lib/points/queries.ts`:**

```ts
export async function getUserPoints(userId: string): Promise<number>
// Sum all positive transactions for userId

export async function getUserTransactions(userId: string, limit = 20): Promise<Transaction[]>
// Latest N transactions for a user, joined with task info

export async function getHouseholdLeaderboard(householdId: string): Promise<{
  userId: string
  name: string
  color: string
  avatar: string
  totalPoints: number
  weekPoints: number // points earned in current week
}[]>
// All users sorted by totalPoints desc
```

**2. Create `lib/points/actions.ts`:**

```ts
export async function spendPoints(userId: string, rewardId: string): Promise<void>
// 1. Load reward (check isActive, householdId matches)
// 2. Load user's current points (sum of transactions)
// 3. If points < reward.pointsCost: throw error "Niet genoeg punten"
// 4. Create negative transaction:
//    { userId, rewardId, points: -reward.pointsCost, description: `Reward ingewisseld: ${reward.title}` }
// 5. revalidatePath('/rewards')
```

**3. Update the users table approach:**

Instead of storing `totalPoints` on the user record (which can get out of sync), always calculate it from transactions. Update `getUserPoints` to sum the transactions table. Remove the `totalPoints` column from users if it causes confusion — use a SQL view or always compute on-the-fly.

Actually: keep `totalPoints` as a denormalized cache for performance, but always update it atomically when creating a transaction:
```ts
// After inserting transaction:
await db.update(users)
  .set({ totalPoints: sql`total_points + ${points}` })
  .where(eq(users.id, userId))
```

**4. Points display in Today header:**

Update the Today page header to show a live points count for the current user, fetched server-side.

**5. Weekly streak tracking:**

Add a `currentStreak` (integer, default 0) and `lastCompletionDate` (date, nullable) to the users table.

Create `lib/points/streaks.ts`:
```ts
export async function updateStreak(userId: string): Promise<number> {
  // Load user's lastCompletionDate and currentStreak
  // If lastCompletionDate = yesterday: streak + 1
  // If lastCompletionDate = today: no change (already counted)
  // If lastCompletionDate < yesterday: reset to 1
  // Update user record, return new streak value
}
```

Call `updateStreak` after every task completion.

Run `npm run db:push` after schema changes.
```

---

### Stap 14 — Reward store

**Wat:** Een simpele winkel waar gebruikers punten kunnen inwisselen voor custom beloningen.

---

**AI-prompt:**

```
Build the Reward Store for ADHDTasks at `app/(app)/rewards/page.tsx`.

**1. Rewards page:**

Header: "Jouw punten: 🟢 142 pts" (current user's points, large)

Section 1 — Available rewards:
- Grid of reward cards (2 columns on mobile)
- Each card: title, description (if any), cost in points, "Inwisselen" button
- Button is grayed out + disabled if user doesn't have enough points
- Confirm dialog before spending: "Weet je het zeker? Dit kost je 50 punten."

Section 2 — Rewards beheren (collapsible, visible to all users):
- Add new reward form: title, description, pointsCost
- Toggle active/inactive on existing rewards

**2. Reward card component (`components/rewards/RewardCard.tsx`):**
- Show affordability indicator: if user can afford it → green border, if not → gray with "Nog X punten nodig"

**3. Server Actions in `lib/rewards/actions.ts`:**

```ts
export async function createReward(data: { title: string; description?: string; pointsCost: number })
export async function toggleReward(rewardId: string)
export async function redeemReward(rewardId: string) // calls spendPoints from lib/points/actions.ts
```

**4. After redemption:**
- Show a success toast: "🎉 Genoten van: [reward title]!"
- Show confetti animation (use `canvas-confetti`: `npm install canvas-confetti @types/canvas-confetti`)

**5. Transaction history tab:**
- Simple list of last 20 transactions
- Green rows for earned points, red rows for spent points
- Shows task name or reward name + date + points change
```

---

## Fase 7 — PWA & Polish

---

### Stap 15 — PWA setup

**Wat:** De app installeerbaar maken als Progressive Web App op iOS en Android.

**Waarom:** PWA is vereist voor Web Push op iOS. Bovendien voelt een geïnstalleerde app veel sneller en meer native aan, wat past bij de ADHD-doelgroep.

---

**AI-prompt:**

```
Set up the ADHDTasks app as a Progressive Web App (PWA).

**1. Create `public/manifest.json`:**

```json
{
  "name": "ADHDTasks",
  "short_name": "Tasks",
  "description": "Gamified household task manager for ADHD",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**2. Create placeholder icons:**
- Create a simple SVG-based icon and convert to PNG at 192x192 and 512x512
- Place in `/public/` folder
- Also create `/public/badge-72.png` for notification badge

**3. Update `app/layout.tsx`:**

```tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ADHDTasks',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1, // prevent zoom on input focus (iOS)
  },
}
```

Add to `<head>`:
```html
<link rel="apple-touch-icon" href="/icon-192.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

**4. Install prompt component (`components/layout/InstallBanner.tsx`):**

```tsx
'use client'
// Listen for 'beforeinstallprompt' event
// If fired: show a subtle bottom banner "Installeer de app voor de beste ervaring"
// With "Installeren" button that calls event.prompt()
// On iOS: show different message "Tik op Delen → Zet op beginscherm" with Safari share icon
// Dismiss button saves preference to localStorage: 'install-dismissed'
```

**5. Register service worker:**

Add to `app/layout.tsx` a client component that runs:
```ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

**6. Offline fallback:**

Add to `public/sw.js` a basic cache strategy:
- Cache the /today page and all static assets on install
- Serve from cache when offline
- Show a simple offline message if /today is not cached
```

---

### Stap 16 — UX polish & streaks

**Wat:** Visuele afwerking: streak teller, micro-animaties, lege states, en responsive fine-tuning.

---

**AI-prompt:**

```
Polish the ADHDTasks UI with visual feedback, animations, and streak display.

**1. Streak display (`components/layout/StreakBadge.tsx`):**
- Show current user's streak on the Today header: "🔥 5" 
- Animate with a pulse effect when streak increases
- Show "🔥 0" in gray if no streak (no completed tasks yesterday)
- Tooltip on hover/press: "Je hebt X dagen op rij taken gedaan!"

**2. Task completion animation:**
When a task is marked done:
- Card slides to the bottom of the list with a smooth CSS transition (300ms ease-out)
- Green checkmark overlays the card briefly
- "+10 pts" floats up from the card and fades out (keyframe animation)
- If streak increased: "🔥 Streak! X dagen" toast appears

**3. Penalty counter on task cards:**
- Add a subtle pulsing red dot on overdue task cards
- Show countdown: "Verliest 2 pts per dag" in small text below the points display

**4. Empty states:**
- Today — all done: Full-screen celebration with confetti + "Alles gedaan! 🎉" + today's earned points summary
- Today — nothing assigned: "Geen taken voor vandaag" with a sun illustration
- Rewards — no rewards yet: "Nog geen beloningen. Voeg er een toe! →"

**5. Loading states:**
- Skeleton cards on the Today page while loading (use ShadCN Skeleton)
- Optimistic updates on all button presses (don't wait for server response to update UI)

**6. Responsive fine-tuning:**
- Test on 375px (iPhone SE) and 390px (iPhone 14)
- All buttons minimum 56px height
- No horizontal scroll
- Safe area insets for notched phones: `env(safe-area-inset-bottom)` for bottom nav

**7. Color system:**
- Earned points: `text-emerald-600` / `bg-emerald-50`
- Penalties: `text-red-600` / `bg-red-50`  
- Overdue border: `border-l-4 border-red-500`
- Completed: `opacity-60` with strikethrough on title
- Streak: `text-orange-500`
```

---

## Fase 8 — Statistieken (optioneel)

---

### Stap 17 — Stats dashboard

**Wat:** Eenvoudig statistiekenscherm met wekelijkse punten, completion rate, en vergelijking tussen gebruikers.

---

**AI-prompt:**

```
Build a simple stats dashboard for ADHDTasks at `app/(app)/stats/page.tsx`.

**Keep it simple — this is a nice-to-have. No charts library, just clear numbers and bars.**

**1. Stats page layout:**

Section 1 — This week:
- Household total points this week (big number)
- Per user: name + avatar + points this week as a horizontal progress bar
- Color = user's profile color

Section 2 — Completion rate (last 7 days):
- Per user: "Naam: 8/10 taken (80%)" 
- Simple colored bar

Section 3 — Streaks:
- All users sorted by streak (highest first)
- "🔥 Naam — 5 dagen" format

Section 4 — All time:
- Total points per user (bar chart using only CSS/Tailwind, no chart library)
- Most productive day of the week (based on completedAt)

**2. Create `lib/stats/queries.ts`:**

```ts
export async function getWeeklyStats(householdId: string, weekStart: Date)
// Returns per-user: pointsThisWeek, tasksCompleted, tasksTotal

export async function getCompletionRate(userId: string, days: 7 | 30)
// Returns: completed / total instances in last N days

export async function getAllTimeStats(householdId: string)
// Returns per-user: totalPoints, totalTasksCompleted
```

**3. Refresh button:**
- Add a manual "Vernieuwen" button (Server Component revalidation)
- Stats are not real-time — that's fine
```

---

## Fase 9 — Deployment

---

### Stap 18 — Vercel deployment

**Wat:** De app live zetten op Vercel met alle environment variables en cron jobs geconfigureerd.

---

**AI-prompt:**

```
Deploy ADHDTasks to Vercel using the Vercel CLI. The project is already linked via `vercel link` (done in Step 1) and most env vars were set in Step 2. This step finalizes the remaining vars and deploys.

**1. Verify all environment variables are set via CLI:**

Run `vercel env ls` to see what's already configured. Then add any missing vars:
```bash
vercel env add SESSION_SECRET production
vercel env add SESSION_SECRET preview
vercel env add SESSION_SECRET development

vercel env add VAPID_PUBLIC_KEY production
vercel env add VAPID_PUBLIC_KEY preview

vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_PRIVATE_KEY preview

vercel env add VAPID_EMAIL production
vercel env add VAPID_EMAIL preview

vercel env add CRON_SECRET production
vercel env add CRON_SECRET preview
```

For NEXT_PUBLIC_APP_URL: set to your Vercel domain after the first deploy (see step 3).

After adding all vars, pull the latest to local:
```bash
vercel env pull .env.local
```

**2. Pre-deployment checklist — verify these automatically:**
```bash
# Confirm vercel.json has all 4 cron jobs:
cat vercel.json

# Run a local production build to catch errors before deploying:
npm run build

# Push schema to Neon production DB one final time:
npm run db:push
```
Fix any build errors before continuing. Do not deploy if `npm run build` fails.

**3. Deploy to production:**
```bash
vercel --prod
```
Note the deployment URL from the output (e.g. `https://adhd-tasks.vercel.app`).

**4. Set NEXT_PUBLIC_APP_URL to the live domain:**
```bash
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://adhd-tasks.vercel.app (or your custom domain)

vercel env add NEXT_PUBLIC_APP_URL preview
# Enter: https://adhd-tasks.vercel.app

# Re-deploy to apply the new env var:
vercel --prod
```

**5. Verify cron jobs via CLI:**
```bash
vercel inspect --wait
```
This shows the deployment details including cron configuration. You should see all 4 cron paths listed. To trigger a cron manually for testing:
```bash
# Trigger the daily scheduler manually:
curl -H "Authorization: Bearer <your-CRON_SECRET>" \
  https://adhd-tasks.vercel.app/api/cron/daily

# Trigger phase 1 notification manually:
curl -H "Authorization: Bearer <your-CRON_SECRET>" \
  https://adhd-tasks.vercel.app/api/cron/notify/phase1
```
Both should return `{ "success": true }`.

**6. Add custom domain (optional):**
```bash
vercel domains add yourdomain.com
vercel alias set adhd-tasks.vercel.app yourdomain.com
```
Then update NEXT_PUBLIC_APP_URL to the custom domain and re-deploy.

**7. Post-deployment smoke test — run through this checklist:**
- [ ] Open the live URL → redirected to /setup
- [ ] Complete household setup → redirected to /pin
- [ ] Login with PIN → redirected to /today
- [ ] Create a task → appears on Today view
- [ ] Mark task as done → points awarded, animation plays
- [ ] Enable push notifications → confirm permission prompt appears
- [ ] Trigger phase 1 cron manually → receive push notification on device
- [ ] Install as PWA (Add to Home Screen on iOS/Android) → app opens standalone

Report any errors from `vercel --prod` output or the smoke test.
```

---

## Overzicht & Volgorde

| # | Stap | Fase | Geschatte tijd |
|---|------|------|----------------|
| 1 | Next.js + tooling setup | Fundament | 30 min |
| 2 | Neon database verbinden | Fundament | 20 min |
| 3 | Database schema | Fundament | 45 min |
| 4 | OTP PIN authenticatie | Auth | 2 uur |
| 5 | Household & users setup | Auth | 1.5 uur |
| 6 | Recurrence engine (+ tests) | Task engine | 3 uur |
| 7 | Task instance scheduler | Task engine | 1.5 uur |
| 8 | Today view | Core UI | 2 uur |
| 9 | Done & Approval flow | Core UI | 2 uur |
| 10 | Task beheer | Core UI | 1.5 uur |
| 11 | Web Push setup | Notificaties | 2 uur |
| 12 | Vercel Cron notificaties | Notificaties | 1.5 uur |
| 13 | Punten systeem | Gamificatie | 1.5 uur |
| 14 | Reward store | Gamificatie | 1.5 uur |
| 15 | PWA setup | Polish | 1 uur |
| 16 | UX polish & animaties | Polish | 2 uur |
| 17 | Stats dashboard | Optioneel | 1.5 uur |
| 18 | Vercel deployment | Deploy | 30 min |

**Totale schatting MVP (stap 1-15): ~25 uur**  
**Inclusief optionele stats: ~27 uur**

---

*Gegenereerd op 2026-05-03 — ADHDTasks bouwplan v1.0*
