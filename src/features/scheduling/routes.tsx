import { Hono } from "hono";
import { shiftRepository } from "../../Repositories/ShiftRepository";
import { z } from "zod";
import { validator } from "hono/validator";

const app = new Hono();

// Schema for creating a shift
const createShiftSchema = z.object({
    startTime: z.string().transform((str) => new Date(str)),
    endTime: z.string().transform((str) => new Date(str)),
});

/**
 * Staff Routes
 */
// Show staff's own shifts
app.get("/", async (c) => {
    const user = c.get("user");
    const shifts = await shiftRepository.getShiftsByUser(user.id);
    return c.json(shifts);
});

// Create new shift request
app.post("/", validator("json", (value, c) => {
    const parsed = createShiftSchema.safeParse(value);
    if (!parsed.success) return c.text("Invalid input", 400);
    return parsed.data;
}), async (c) => {
    const user = c.get("user");
    const { startTime, endTime } = c.req.valid("json");

    // Basic validation: end time > start time
    if (endTime <= startTime) {
        return c.text("End time must be after start time", 400);
    }

    const shift = await shiftRepository.createShift({
        userId: user.id,
        hallId: user.hallId, // Assuming staff belongs to a hall
        startTime,
        endTime,
    });

    return c.json(shift);
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
    return c.json({ success: true });
});

/**
 * Admin Routes
 */
// Show all pending/approved shifts
app.get("/admin", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "manager") {
        return c.text("Unauthorized", 403);
    }

    const hallId = c.req.query("hallId") ? parseInt(c.req.query("hallId")!) : undefined;
    const status = c.req.query("status") as ShiftStatus | "all" | undefined;
    const dateStr = c.req.query("date");
    const date = dateStr ? new Date(dateStr) : undefined;

    let shifts;
    if (hallId) {
        shifts = await shiftRepository.getShiftsByHall(hallId, {
            status: status === "all" ? undefined : status,
            date
        });
    } else {
        // If no hall specified, we can still filter by date/status if needed, 
        // but for now let's stick to pending if no specific filters, or all if filters exist
        if (status || date) {
            // This case might need a new generic "getAllShifts" method if we want to search EVERYTHING
            // For now, let's reuse getAllPendingShifts if status is pending or undefined
            if (!status || status === "pending") {
                shifts = await shiftRepository.getAllPendingShifts({ date });
            } else {
                // Fallback or implement getAllShifts(filter)
                shifts = []; // TODO: Implement generic search if needed
            }
        } else {
            shifts = await shiftRepository.getAllPendingShifts();
        }
    }

    return c.json(shifts);
});

// Approve a shift
app.patch("/:id/approve", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "manager") return c.text("Unauthorized", 403);

    const id = parseInt(c.req.param("id"));
    const shift = await shiftRepository.updateShiftStatus(id, "approved");
    return c.json(shift);
});

// Reject a shift
app.patch("/:id/reject", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin" && user.role !== "manager") return c.text("Unauthorized", 403);

    const id = parseInt(c.req.param("id"));
    const shift = await shiftRepository.updateShiftStatus(id, "rejected");
    return c.json(shift);
});

export default app;