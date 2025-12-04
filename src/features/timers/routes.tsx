import { Hono } from "hono";
import { machineSessionRepository } from "../../Repositories/MachineSessionRepository";
import { hallRepository } from "../../Repositories/HallRepository";
import MachineTimers from "../../pages/staff/MachineTimers";
import { MachineCard } from "../../components/MachineCard";

const app = new Hono();

// GET /timers/ (page)
app.get("/", async (c) => {
  const user = c.get("user") as any;
  if (!user) return c.redirect("/login");

  // Get all halls for admin hall selector
  const allHalls = await hallRepository.getAllHalls();

  // Determine which hall to show:
  // 1. If hallId is in query params, use that (for admin switching halls)
  // 2. Otherwise use user's assigned hallId
  const queryHallId = c.req.query("hallId");
  const hallId = queryHallId ? Number(queryHallId) : user.hallId;

  // Admin users without a hallId and no query param should see hall selector
  if (!hallId) {
    // For admins, show the first hall by default or show a hall selector
    if (user.role === "admin" || user.role === "manager") {
      if (allHalls.length > 0) {
        // Redirect to first hall
        return c.redirect(`/timers?hallId=${allHalls[0].id}`);
      }
      return c.text("No halls configured", 404);
    }
    return c.text("Hall not assigned to user", 404);
  }

  const hall = await hallRepository.getHallById(hallId);
  if (!hall) return c.text("Hall not found", 404);

  // Check if user is admin/manager (can view all halls)
  const isAdmin = user.role === "admin" || user.role === "manager";

  return c.html(<MachineTimers user={user} hall={hall} allHalls={isAdmin ? allHalls : undefined} />);
});

// GET /timers/machines
app.get("/machines", async (c) => {
  const user = c.get("user") as any; // set by your auth middleware in index.tsx
  if (!user) return c.redirect("/login");

  // Support hallId from query param for admins
  const queryHallId = c.req.query("hallId");
  const hallId = queryHallId ? Number(queryHallId) : user.hallId;

  if (!hallId) {
    return c.html(
      <div class="col-span-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-yellow-800 font-medium">No hall selected. Please select a hall.</p>
      </div>
    );
  }

  const machines = await machineSessionRepository.getMachinesWithSessions(
    hallId,
    user?.id ?? 0,
  );

  // Render machine cards
  return c.html(
    <>
      {machines.length === 0 ? (
        <div class="col-span-full flex flex-col items-center justify-center py-12">
          <svg
            class="w-16 h-16 text-slate-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="text-slate-500 text-lg font-medium">No machines found</p>
          <p class="text-slate-400 text-sm mt-1">Check back later</p>
        </div>
      ) : (
        machines.map((machine) => <MachineCard machine={machine} />)
      )}
    </>
  );
});

// POST /timers/:machineId/start
app.post("/:machineId/start", async (c) => {
  const user = c.get("user") as any;
  if (!user) return c.redirect("/login");

  const machineId = Number(c.req.param("machineId"));
  const body = await c.req.json().catch(() => ({}));
  const duration = Number(body.duration) || 60;

  const startTime = new Date();
  const expectedEndTime = new Date(Date.now() + duration * 60000);

  try {
    await machineSessionRepository.startSession({
      machineId,
      appointmentId: null,
      startedByUserId: user.id,
      startTime,
      expectedEndTime,
    });
  } catch (error) {
    console.error("Failed to start machine:", error);
    // Return error message in HTML
    return c.html(
      <div class="col-span-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800 font-medium">Failed to start machine. Please try again.</p>
      </div>
    );
  }

  // Fetch updated machine list and return HTML for HTMX
  // Get hallId from the machine we just started
  const machineRepo = await import("../../Repositories/MachineRepository");
  const machine = await machineRepo.machineRepository.getMachineById(machineId);
  const hallId = machine?.hallId || user.hallId;

  const machines = await machineSessionRepository.getMachinesWithSessions(
    hallId,
    user?.id ?? 0,
  );

  return c.html(
    <>
      {machines.length === 0 ? (
        <div class="col-span-full flex flex-col items-center justify-center py-12">
          <svg
            class="w-16 h-16 text-slate-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="text-slate-500 text-lg font-medium">No machines found</p>
          <p class="text-slate-400 text-sm mt-1">Check back later</p>
        </div>
      ) : (
        machines.map((machine) => <MachineCard machine={machine} />)
      )}
    </>
  );
});

// POST /timers/:sessionId/stop
app.post("/:sessionId/stop", async (c) => {
  const user = c.get("user") as any;
  if (!user) return c.redirect("/login");

  const sessionId = Number(c.req.param("sessionId"));

  try {
    await machineSessionRepository.endSession(sessionId);
  } catch (error) {
    console.error("Failed to stop machine:", error);
    // Return error message in HTML
    return c.html(
      <div class="col-span-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800 font-medium">Failed to stop machine. Please try again.</p>
      </div>
    );
  }

  // Fetch updated machine list and return HTML for HTMX
  // Get hallId from session to properly refresh the list
  const session = await machineSessionRepository.getSessionById(sessionId);
  const hallId = session?.hallId || user.hallId;

  if (!hallId) {
    return c.html(
      <div class="col-span-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p class="text-yellow-800 font-medium">No hall selected. Please refresh the page.</p>
      </div>
    );
  }

  const machines = await machineSessionRepository.getMachinesWithSessions(
    hallId,
    user?.id ?? 0,
  );

  return c.html(
    <>
      {machines.length === 0 ? (
        <div class="col-span-full flex flex-col items-center justify-center py-12">
          <svg
            class="w-16 h-16 text-slate-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="text-slate-500 text-lg font-medium">No machines found</p>
          <p class="text-slate-400 text-sm mt-1">Check back later</p>
        </div>
      ) : (
        machines.map((machine) => <MachineCard machine={machine} />)
      )}
    </>
  );
});

export default app;
