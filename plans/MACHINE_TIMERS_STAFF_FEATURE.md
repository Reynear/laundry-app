# Machine Timers Staff Feature (Lenworth)

## Overview
Build a staff dashboard feature that displays all machines in their assigned hall with the ability to set timers on each machine. These timers sync to the client via HTTP polling. Machines with active appointments should be highlighted.

---

## Requirements Summary
1. Staff can view all machines in their hall in a dashboard menu
2. Staff can set timers on individual machines (start/stop)
3. Timers sync to clients via HTTP request (polling mechanism already exists)
4. Machines with current appointments are highlighted
5. Route already exists in sidebar at `/timers`

---

## Architecture Decisions

### Why HTTP Polling (not WebSockets)?
The codebase already uses HTMX with `hx-trigger="every 15s"` for timer updates on the client dashboard. We'll follow this established pattern for consistency.

### Data Model
The existing `machineSessions` table already supports:
- `machineId` - links to machine
- `startTime` / `expectedEndTime` - timer data
- `status` - running/completed
- `appointmentId` - optional, can be null for staff-initiated timers
- `startedByUserId` - who started the timer

This means **no schema changes are needed** - staff-initiated timers will simply have `appointmentId: null`.

---

## Implementation Plan

### Task 1: Add MachineSessionRepository methods (Backend)
**File:** `src/Repositories/MachineSessionRepository.ts`

Add methods:
```typescript
// Get all machines with their current session status for a hall
async getMachinesWithSessions(hallId: number): Promise<MachineWithSession[]>

// End/stop a session manually
async endSession(sessionId: number): Promise<void>
```

**New Type (in types.d.ts):**
```typescript
interface MachineWithSession extends Machine {
  session: MachineSession | null;
  hasActiveAppointment: boolean;
  appointmentDetails?: {
    id: number;
    userId: number;
    userName: string;
    appointmentDatetime: Date;
  };
}
```

---

### Task 2: Create Machine Timers Routes (Backend)
**File:** `src/features/timers/routes.tsx` (new file)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/timers` | Main timers dashboard page |
| GET | `/timers/machines` | HTMX partial for machines list (for polling) |
| POST | `/timers/:machineId/start` | Start a timer on a machine |
| POST | `/timers/:sessionId/stop` | Stop a running timer |

**Authorization:** Staff/Manager/Admin only (reject students)

---

### Task 3: Create Timers Page Components (Frontend)
**Files:**
- `src/pages/staff/MachineTimers.tsx` - Main page component
- `src/features/timers/components/MachineCard.tsx` - Individual machine card

**Machine Card States:**
1. **Available** - Green indicator, "Start Timer" button
2. **In Use (Session Running)** - Orange/Blue indicator, countdown timer, "Stop" button
3. **Has Appointment** - Highlighted border/background, shows appointment info
4. **Out of Service** - Gray, disabled

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Machine Timers - [Hall Name]                            │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ Washer W-01 │ │ Washer W-02 │ │ Washer W-03 │        │
│ │ ⏱ 23:45    │ │ Available   │ │ ⚡ Booked   │        │
│ │ [Stop]     │ │ [Start]     │ │ [Start]     │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                         │
│ ┌─────────────┐ ┌─────────────┐                        │
│ │ Dryer D-01  │ │ Dryer D-02  │                        │
│ │ Available   │ │ Maintenance │                        │
│ │ [Start]     │ │ [Disabled]  │                        │
│ └─────────────┘ └─────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

### Task 4: Register Routes in Main App
**File:** `src/index.tsx`

Add the timers routes to the app:
```typescript
import timersRoutes from "./features/timers/routes";
// ...
app.route("/timers", timersRoutes);
```

---

### Task 5: Client-Side Timer Sync (Already Working)
The client dashboard at `src/pages/dashboard.tsx:63-67` already polls for timer updates every 15 seconds using:
```jsx
hx-get="/dashboard"
hx-trigger="every 15s"
hx-select="#timer-section"
hx-swap="innerHTML"
```

**No changes needed** - staff-created sessions are already returned by `machineSessionRepository.getActiveSessionsForUser()`.

---

### Task 6: Add Timer Duration Input Component
**File:** `src/features/timers/components/TimerDurationInput.tsx`

When staff clicks "Start Timer", show a quick input for duration (default to machine's `durationMins`):
- Preset buttons: 30min, 45min, 60min
- Custom input field
- Submit via HTMX POST

---

## File Structure After Implementation
```
src/
├── features/
│   └── timers/
│       ├── routes.tsx           # API routes
│       └── components/
│           ├── MachineCard.tsx  # Machine card component
│           └── TimerDurationInput.tsx
├── pages/
│   └── staff/
│       └── MachineTimers.tsx    # Main page
└── Repositories/
    └── MachineSessionRepository.ts  # Updated with new methods
```

---

## Testing Considerations
1. Test staff can only see machines in their assigned hall
2. Test starting a timer creates a session
3. Test stopping a timer ends the session
4. Test machines with appointments are highlighted
5. Test client receives timer updates via polling
6. Test only staff/manager/admin roles can access

---

## Security Considerations
- Validate `hallId` matches staff's assigned hall
- Validate `machineId` belongs to staff's hall before starting timer
- Rate limit timer start/stop to prevent abuse

---

## Tasks Breakdown

| # | Task | Priority | Complexity |
|---|------|----------|------------|
| 1 | Add types to `types.d.ts` | High | Low |
| 2 | Update `MachineSessionRepository` with new methods | High | Medium |
| 3 | Create `src/features/timers/routes.tsx` | High | Medium |
| 4 | Create `src/pages/staff/MachineTimers.tsx` | High | Medium |
| 5 | Create `src/features/timers/components/MachineCard.tsx` | High | Medium |
| 6 | Create `src/features/timers/components/TimerDurationInput.tsx` | Medium | Low |
| 7 | Register routes in `src/index.tsx` | High | Low |
| 8 | Add HTMX polling to staff timers page | Medium | Low |
| 9 | Test full flow end-to-end | High | Medium |

---

## Status
- [ ] Task 1: Add types to `types.d.ts`
- [ ] Task 2: Update `MachineSessionRepository`
- [ ] Task 3: Create timers routes
- [ ] Task 4: Create `MachineTimers.tsx` page
- [ ] Task 5: Create `MachineCard.tsx` component
- [ ] Task 6: Create `TimerDurationInput.tsx` component
- [ ] Task 7: Register routes in main app
- [ ] Task 8: Add HTMX polling
- [ ] Task 9: End-to-end testing
