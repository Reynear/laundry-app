import { eq } from "drizzle-orm";
import { db } from "../db";
import { machines } from "../db/schema/schema";

export class MachineRepository {
	/**
	 * Get all machines for a hall
	 */
	async getMachinesByHall(hallId: number): Promise<Machine[]> {
		const rows = await db
			.select()
			.from(machines)
			.where(eq(machines.hallId, hallId));

		return rows.map((row) => ({
			id: row.id,
			hallId: row.hallId,
			type: row.type as MachineType,
			durationMins: row.durationMins || 45,
			status: row.status as MachineStatus,
			pricePerCycle: row.pricePerCycle ? parseFloat(row.pricePerCycle) : 0,
		}));
	}

	/**
	 * Get a machine by ID
	 */
	async getMachineById(id: number): Promise<Machine | undefined> {
		const rows = await db.select().from(machines).where(eq(machines.id, id));
		if (rows.length === 0) return undefined;

		const row = rows[0];
		return {
			id: row.id,
			hallId: row.hallId,
			type: row.type as MachineType,
			durationMins: row.durationMins || 45,
			status: row.status as MachineStatus,
			pricePerCycle: row.pricePerCycle ? parseFloat(row.pricePerCycle) : 0,
		};
	}

	/**
	 * Find an available machine for a specific time slot
	 * Note: This logic is largely handled in AppointmentRepository.createAppointment now,
	 * but we keep this for potential utility use.
	 */
	async findAvailableMachineForAppointment(
		hallId: number,
		type: MachineType,
		startTime: Date,
		durationMins: number,
		existingAppointments: {
			machineId: number;
			appointmentDatetime: Date;
			durationMins: number;
		}[],
	): Promise<Machine | undefined> {
		const hallMachines = await this.getMachinesByHall(hallId);
		const candidateMachines = hallMachines.filter(
			(m) =>
				m.type === type &&
				m.status !== "out_of_service" &&
				m.status !== "maintenance",
		);

		const endTime = new Date(startTime.getTime() + durationMins * 60000);

		// Find a machine that doesn't have a conflict
		const availableMachine = candidateMachines.find((machine) => {
			const hasConflict = existingAppointments.some((appt) => {
				if (appt.machineId !== machine.id) return false;

				const apptStart = appt.appointmentDatetime;
				const apptEnd = new Date(
					apptStart.getTime() + appt.durationMins * 60000,
				);

				// Check overlap
				return apptStart < endTime && apptEnd > startTime;
			});

			return !hasConflict;
		});

		return availableMachine;
	}
}

export const machineRepository = new MachineRepository();
