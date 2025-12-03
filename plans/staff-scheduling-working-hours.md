# Plan: Staff Scheduling / Working Hours Feature

**Assignee:** Keona  
**Status:** Pending  
**Created:** 2025-11-28

## Summary
Build a scheduling feature that allows staff to enter their working hours (shifts) and have them verified/approved by an admin. This includes a `ShiftRepository`, routes for managing shifts, and UI components for both staff (RosterManager) and admin (ScheduleViewer).

---

## Existing Infrastructure

### Database Schema (Already Exists)
The `shifts` table already exists in `src/db/schema/schema.ts`:
```typescript
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  hallId: integer("hall_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: shiftStatusEnum("status").default("scheduled"), // "scheduled" | "completed" | "absent"
});
```

### Schema Enhancement Needed
Add a new status for admin approval workflow:
- Current: `"scheduled" | "completed" | "absent"`
- Proposed: `"pending" | "approved" | "rejected" | "completed" | "absent"`

### Navigation (Already Exists)
Staff sidebar already has `/scheduling` link in `src/layouts/index.tsx` (line 264-281).

---

## Implementation Plan

### Phase 1: Database & Types

#### 1.1 Update Schema Enum
**File:** `src/db/schema/schema.ts`
- Modify `shiftStatusEnum` to include approval workflow statuses:
  ```typescript
  export const shiftStatusEnum = pgEnum("shift_status", [
    "pending",    // Staff submitted, awaiting admin approval
    "approved",   // Admin approved
    "rejected",   // Admin rejected
    "completed",  // Shift was completed
    "absent",     // Staff was absent
  ]);
  ```

#### 1.2 Add Shift Type
**File:** `src/types.d.ts`
- Add `ShiftStatus` type
- Add `Shift` interface:
  ```typescript
  type ShiftStatus = "pending" | "approved" | "rejected" | "completed" | "absent";
  
  type Shift = {
    id: number;
    userId: number;
    hallId: number;
    startTime: Date;
    endTime: Date;
    status: ShiftStatus;
    staffName?: string;
    hallName?: string;
  };
  ```

### Phase 2: Repository Layer

#### 2.1 Create ShiftRepository
**File:** `src/Repositories/ShiftRepository.ts`

Methods:
- `getShiftsByUser(userId: number, filter?: ShiftStatus): Promise<Shift[]>` - Get shifts for a staff member
- `getShiftsByHall(hallId: number, filter?: ShiftStatus): Promise<Shift[]>` - Get all shifts for a hall (for admin)
- `getAllPendingShifts(): Promise<Shift[]>` - Get all pending shifts (for admin approval)
- `getShiftById(id: number): Promise<Shift | null>` - Get single shift
- `createShift(data: {...}): Promise<Shift>` - Staff creates a shift request
- `updateShiftStatus(id: number, status: ShiftStatus): Promise<Shift | null>` - Admin approves/rejects
- `deleteShift(id: number): Promise<boolean>` - Delete a shift
- `getShiftsForWeek(hallId: number, weekStart: Date): Promise<Shift[]>` - Get week view

#### 2.2 Export Repository
**File:** `src/Repositories/index.ts`
- Add `export * from "./ShiftRepository";`

### Phase 3: Routes

#### 3.1 Create Scheduling Routes
**File:** `src/features/scheduling/routes.tsx`

**Staff Routes:**
- `GET /scheduling` - Show staff's own shifts (RosterManager view)
- `POST /scheduling` - Create new shift request (pending approval)
- `DELETE /scheduling/:id` - Cancel a pending shift request

**Admin Routes:**
- `GET /scheduling/admin` - Show all pending/approved shifts (ScheduleViewer)
- `PATCH /scheduling/:id/approve` - Approve a shift
- `PATCH /scheduling/:id/reject` - Reject a shift

#### 3.2 Register Routes
**File:** `src/index.tsx`
- Add `import scheduling from "./features/scheduling/routes";`
- Add `app.use("/scheduling/*", authMiddleware);`
- Add `app.route("/scheduling", scheduling);`

### Phase 4: UI Components

#### 4.1 Staff View - RosterManager
**File:** `src/features/scheduling/components/RosterManager.tsx`

Features:
- Weekly calendar view showing staff's shifts
- Form to add new shift (date picker, start time, end time)
- Status badges (pending/approved/rejected)
- Cancel button for pending shifts
- Color coding: pending=yellow, approved=green, rejected=red

#### 4.2 Admin View - ScheduleViewer  
**File:** `src/features/scheduling/components/ScheduleViewer.tsx`

Features:
- List of all shifts grouped by hall or date
- Filter by status (pending/approved/all)
- Approve/Reject buttons for pending shifts
- Staff name displayed
- Weekly overview of approved shifts

#### 4.3 Shift List Item Component
**File:** `src/features/scheduling/components/ShiftListItem.tsx`

Reusable component for displaying a single shift with:
- Date/time display
- Staff name (for admin view)
- Status badge
- Action buttons (approve/reject for admin, cancel for staff)

### Phase 5: Staff Page

#### 5.1 Staff Scheduling Page
**File:** `src/pages/staff/Scheduling.tsx`

Main page wrapper that uses `RosterManager` component.

### Phase 6: Admin Integration

#### 6.1 Update Layout for Admin
**File:** `src/layouts/index.tsx`

Add admin sidebar (if not exists) or update staff sidebar to show admin-only links when user role is `manager` or `admin`.

---

## File Structure

```
src/
├── features/
│   └── scheduling/
│       ├── routes.tsx              # API routes
│       └── components/
│           ├── RosterManager.tsx   # Staff shift management
│           ├── ScheduleViewer.tsx  # Admin approval view
│           └── ShiftListItem.tsx   # Reusable shift display
├── pages/
│   └── staff/
│       └── Scheduling.tsx          # Staff scheduling page
├── Repositories/
│   └── ShiftRepository.ts          # Database operations
└── types.d.ts                      # Type definitions
```

---

## Tasks Breakdown

### Database & Types
- [ ] Update `shiftStatusEnum` in schema.ts to add pending/approved/rejected //DONE
- [ ] Run database migration (`npm run db:push`) //getting an error
- [ ] Add `ShiftStatus` type to types.d.ts //DONE
- [ ] Add `Shift` interface to types.d.ts //DONE

### Repository
- [ ] Create `ShiftRepository.ts` with all methods //created but errors 
- [ ] Export from `Repositories/index.ts` // DONE

### Routes
- [ ] Create `src/features/scheduling/routes.tsx`//DONE
- [ ] Implement GET /scheduling (staff view)
- [ ] Implement POST /scheduling (create shift)
- [ ] Implement DELETE /scheduling/:id (cancel shift)
- [ ] Implement GET /scheduling/admin (admin view)
- [ ] Implement PATCH /scheduling/:id/approve
- [ ] Implement PATCH /scheduling/:id/reject
- [ ] Register routes in index.tsx //DONE

### UI Components
- [ ] Create `ShiftListItem.tsx` component
- [ ] Create `RosterManager.tsx` component (staff)
- [ ] Create `ScheduleViewer.tsx` component (admin)
- [ ] Create `src/pages/staff/Scheduling.tsx` page

### Integration
- [ ] Update sidebar to show admin scheduling link for managers/admins
- [ ] Test staff workflow (create → pending → approved)
- [ ] Test admin workflow (view pending → approve/reject)

---

## User Flows

### Staff Flow
1. Staff navigates to `/scheduling`
2. Sees their current/upcoming shifts with status
3. Clicks "Add Shift" to open form
4. Selects date, start time, end time
5. Submits → shift created with `pending` status
6. Waits for admin approval
7. Can cancel pending shifts

### Admin Flow
1. Admin/Manager navigates to `/scheduling/admin`
2. Sees list of pending shifts from all staff
3. Can filter by hall, date, or status
4. Clicks "Approve" or "Reject" on each shift
5. Staff sees updated status

---

## Notes
- The `shifts` table already exists, just needs status enum update
- Staff can only manage their own shifts
- Admins/Managers can approve/reject shifts for their hall (or all halls for admin)
- Use HTMX for interactive updates (approve/reject without page reload)
- Follow existing patterns from notices/appointments features
