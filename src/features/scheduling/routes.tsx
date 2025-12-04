import { Hono } from "hono";
import { shiftRepository } from "../../Repositories/ShiftRepository";
import { z } from "zod";
import { validator } from "hono/validator";
import { DashboardLayout } from "../../layouts";
import { RosterManager } from "./components/RosterManager";
import { ScheduleViewer } from "./components/ScheduleViewer";
import { ShiftListItem } from "./components/ShiftListItem";

const app = new Hono();

//Creating a shcema for the shifts
const createShiftSchema = z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
});

//Staff Routes
// Shows the staff member's own shifts
app.get("/", async (c) => {
    const user = c.get("user");

    //If the person is an admin then they will have access to seeing the admin scheduling page instead of the regular page
    if (user.role === "admin") {
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

//In order to create a new shift request
app.post("/", validator("form", (value, c) => {
    const parsed = createShiftSchema.safeParse(value);
    if (!parsed.success) return c.text("Invalid input", 400);
    return parsed.data;
}), async (c) => {
    const user = c.get("user");
    const { date, startTime, endTime } = c.req.valid("form");

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    const now = new Date();

    //Making sure one cannot create shifts in the past 
    if (start < now) {
        return c.text("Shifts cannot be in the past", 400);
    }

    //Making sure end time is after start time
    if (end <= start) {
        return c.text("End time has to be after start time", 400);
    }

    //Creating the shift
    const shift = await shiftRepository.createShift({
        userId: user.id,
        hallId: user.hallId,
        startTime: start,
        endTime: end,
    });


    return c.html(<ShiftListItem shift={shift} />);
});

//For a staff member to cancel a pending shift request
app.delete("/:id", async (c) => {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    const shift = await shiftRepository.getShiftById(id);
    if (!shift) return c.text("Shift not found", 404);

   
    //Admin deleting shifts
    await shiftRepository.deleteShift(id);
    return c.body(null, 200);
});

//Routes for the admins
// Showing all pending shifts
app.get("/admin", async (c) => {
    const user = c.get("user");
    if (user.role !== "admin") {
        return c.redirect("/scheduling");
    }

    const hallId = c.req.query("hallId") ? parseInt(c.req.query("hallId")!) : undefined;
    const status = c.req.query("status") as any | "all" | undefined;
    const dateStr = c.req.query("date");
    const date = dateStr ? new Date(dateStr) : undefined;

    //To get the drop down listing all the halls
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
                //Getting all pending shifts for the filter
                shifts = await shiftRepository.getAllPendingShifts({ date });
            } else {
                //Getting all shifts for the filter
                shifts = await shiftRepository.getAllShifts({ date });
            }
        } else {
            //Default pending shifts
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

//Admin approving a shift
app.patch("/:id/approve", async (c) => {
    const id = parseInt(c.req.param("id"));
    const shift = await shiftRepository.updateShiftStatus(id, "approved");

    if (!shift) return c.text("Error while updating shift", 500);
    return c.html(<ShiftListItem shift={shift} isAdmin={true} />);
});

//Admin rejecting a shift
app.patch("/:id/reject", async (c) => {
    const id = parseInt(c.req.param("id"));
    const shift = await shiftRepository.updateShiftStatus(id, "rejected");

    if (!shift) return c.text("Error while updating shift", 500);
    return c.html(<ShiftListItem shift={shift} isAdmin={true} />);
});

export default app;