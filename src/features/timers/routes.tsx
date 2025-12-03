import { Router } from "express";
import { machineSessionRepository } from "../../Repositories/MachineSessionRepository";
import { requireStaff } from "../../middleware/auth";

const router = Router();

router.get("/", requireStaff, async (req, res) => {
  res.render("staff/MachineTimers");
});

router.get("/machines", requireStaff, async (req, res) => {
  const hallId = req.user.hallId;

  const machines = await machineSessionRepository.getMachinesWithSessions(
    hallId,
    // pass current user for isUsersMachine mapping
    req.user?.id ?? 0,
  );

  res.render("components/MachineList", { machines });
});

router.post("/:machineId/start", requireStaff, async (req, res) => {
  const { machineId } = req.params;
  const { duration } = req.body;

  const startTime = new Date();
  const expectedEndTime = new Date(Date.now() + duration * 60000);

  await machineSessionRepository.startSession({
    machineId: Number(machineId),
    appointmentId: null,
    startedByUserId: req.user.id,
    startTime,
    expectedEndTime,
  });

  res.redirect("/timers/machines");
});

router.post("/:sessionId/stop", requireStaff, async (req, res) => {
  await machineSessionRepository.endSession(Number(req.params.sessionId));
  res.redirect("/timers/machines");
});

export default router;
