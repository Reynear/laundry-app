import { Hono } from "hono";
import { shiftRepository } from "../../Repositories/ShiftRepository";
import { z } from "zod";
import { validator } from "hono/validator";
import { DashboardLayout } from "../../layouts";
import { Scheduling } from "../../pages/staff/Scheduling";
import { RosterManager } from "./components/RosterManager";
import { ScheduleViewer } from "./components/ScheduleViewer";
import { ShiftListItem } from "./components/ShiftListItem";

const app = new Hono();

// Schema for creating a shift
const createShiftSchema = z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
});

/**
 * Staff Routes
 */
// Show staff's own shifts
app.get("/", async (c) => {
    const user = c.get("user");

    // If admin/manager, redirect to admin view
    if (user.role === "admin" || user.role === "manager") {
        return c.redirect("/scheduling/admin");
    }

    const shifts = await shiftRepository.getShiftsByUser(user.id);

    return c.html(
        <DashboardLayout user={user} currentPath="/scheduling">
            <div className="max-w-4xl mx-auto">
                <RosterManager shifts={shifts} />
            </div>
        </DashboardLayout>
    );
});

// Create new shift request
app.post("/", validator("form", (value, c) => {
    const parsed = createShiftSchema.safeParse(value);
    if (!parsed.success) return c.text("Invalid input", 400);
    return parsed.data;
}), async (c) => {
    const user = c.get("user");
    const { date, startTime, endTime } = c.req.valid("form");

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    // Basic validation: end time > start time
    if (end <= start) {
        return c.text("End time must be after start time", 400);
    }

    const shift = await shiftRepository.createShift({
        userId: user.id,
        hallId: user.hallId,
        startTime: start,
        endTime: end,
    });

    // Return just the new list item to be prepended
    return c.html(<ShiftListItem shift={shift} />);
});

// Cancel a pending shift request
app.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    const shift = await shiftRepository.getShiftById(id);
    if (!shift) return c.text("Shift not found", 404);

    if (shift.userId !== user.id) return c.text("Unauthorized", 403);
    if (shift.status !== "pending") return c.text("Cannot cancel non-pending shift", 400);

    await shiftRepository.deleteShift(id);
    return c.body(null); // Return empty body to remove the element
});

/**
 * Admin Routes
 */
// Show all pending/approved shifts
app.get("/admin", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "manager") {
        return c.redirect("/scheduling");
    }

    const hallId = c.req.query("hallId") ? parseInt(c.req.query("hallId")!) : undefined;
    const status = c.req.query("status") as ShiftStatus | "all" | undefined;
    const dateStr = c.req.query("date");
    const date = dateStr ? new Date(dateStr) : undefined;

    // Fetch all halls for the dropdown
    const { hallRepository } = await import("../../Repositories/HallRepository");
    const halls = await hallRepository.getAllHalls();

    let shifts;
    if (hallId) {
        shifts = await shiftRepository.getShiftsByHall(hallId, {
            status: status === "all" ? undefined : status,
            date
        });
    } else {
        if (status || date) {
            if (!status || status === "pending") {
                shifts = await shiftRepository.getAllPendingShifts({ date });
            } else {
                // Fallback for now
                shifts = await shiftRepository.getAllPendingShifts({ date });
            }
        } else {
            shifts = await shiftRepository.getAllPendingShifts();
        }
    }

    return c.html(
        <DashboardLayout user={user} currentPath="/scheduling">
            <div className="max-w-4xl mx-auto">
                <ScheduleViewer shifts={shifts} filter={{ status, hallId, date: dateStr }} halls={halls} />
            </div>
        </DashboardLayout>
    );
});

// Approve a shift
app.patch("/:id/approve", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "manager") return c.text("Unauthorized", 403);

    const id = parseInt(c.req.param("id"));
    const shift = await shiftRepository.updateShiftStatus(id, "approved");

    if (!shift) return c.text("Error updating shift", 500);
    return c.html(<ShiftListItem shift={shift} isAdmin={true} />);
});

// Reject a shift
app.patch("/:id/reject", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "manager") return c.text("Unauthorized", 403);

    const id = parseInt(c.req.param("id"));
    const shift = await shiftRepository.updateShiftStatus(id, "rejected");

    if (!shift) return c.text("Error updating shift", 500);
    return c.html(<ShiftListItem shift={shift} isAdmin={true} />);
});

export default app;