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

  const hall = await hallRepository.getHallById(user.hallId);
  if (!hall) return c.text("Hall not found", 404);

  return c.html(<MachineTimers user={user} hall={hall} />);
});

// GET /timers/machines
app.get("/machines", async (c) => {
  const user = c.get("user") as any; // set by your auth middleware in index.tsx
  if (!user) return c.redirect("/login");

  const hallId = user.hallId;
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

  await machineSessionRepository.startSession({
    machineId,
    appointmentId: null,
    startedByUserId: user.id,
    startTime,
    expectedEndTime,
  });

  return c.redirect("/timers/machines");
});

// POST /timers/:sessionId/stop
app.post("/:sessionId/stop", async (c) => {
  const sessionId = Number(c.req.param("sessionId"));
  await machineSessionRepository.endSession(sessionId);
  return c.redirect("/timers/machines");
});

export default app;
