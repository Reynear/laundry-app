import { appointmentRepository } from "../../../Repositories";
import { assignMachine } from "./MachineAssigner";

/**
 * Creates a new reservation (appointment) by assigning a machine and saving to DB.
 */
export async function createReservation(data: {
	userId: number;
	hallId: number;
	appointmentDatetime: Date;
	durationMins: number;
	serviceType: "wash" | "dry";
	totalCost: number;
}) {
	// 1. Assign Machine
	const machineId = await assignMachine(
		data.hallId,
		data.appointmentDatetime,
		data.durationMins,
		data.serviceType,
	);

	// 2. Create Appointment via Repository
	return appointmentRepository.createAppointment({
		...data,
		machineId,
		totalCost: data.totalCost.toString(),
	});
}

/**
 * Cancels a reservation.
 */
export async function cancelReservation(id: number) {
	return appointmentRepository.deleteAppointment(id);
}
