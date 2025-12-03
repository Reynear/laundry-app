import { Hono } from "hono";
import { machineSessionRepository } from "../../Repositories/MachineSessionRepository";

const app = new Hono();

// GET /timers/ (page)
app.get("/", (c) => {
  // If you use server-side rendering, replace with your renderer.
  return c.text("Machine Timers page (replace with render)");
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

  // Replace with c.html/c.render if you have templating wired up.
  return c.json(machines);
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
