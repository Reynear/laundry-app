type UserRole = "student" | "staff" | "manager" | "admin";
type MachineType = "washer" | "dryer";
type MachineStatus = "available" | "in_use" | "out_of_service" | "maintenance";
type AppointmentStatus =
	| "pending"
	| "confirmed"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "no_show";
type SessionStatus = "running" | "completed" | "cancelled";
type ServiceType = "wash" | "dry" | "wash_dry";

interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	hallId: number;
	hallName?: string;
	role: UserRole;
	walletBalance?: number;
}

type Hall = {
	id: number;
	name: string;
	openingTime: string; // "HH:MM" 24h format
	closingTime: string; // "HH:MM" 24h format
};

type Machine = {
	id: number;
	hallId: number;
	type: MachineType;
	durationMins: number;
	status: MachineStatus;
	pricePerCycle: number;
};

type Appointment = {
	id: number;
	userId: number;
	hallId: number;
	machineId: number | null;
	appointmentDatetime: Date;
	durationMins: number;
	status: AppointmentStatus;
	totalCost: number;
	createdAt: Date;
	serviceType: ServiceType;
	cancelledAt?: Date;
	hallName?: string;
};

type MachineSession = {
	id: number;
	machineId: number;
	machineType: MachineType;
	appointmentId: number | null;
	startedByUserId: number;
	startTime: Date;
	expectedEndTime: Date;
	actualEndTime?: Date;
	sessionStatus: SessionStatus;
	isUsersMachine: boolean;
	hallName?: string;
};

type Notice = {
	id: number;
	authorUserId: number;
	authorName: string;
	hallId: number | null;
	hallName: string | null;
	title: string;
	content: string;
	isPublished: boolean;
	publishedAt: Date;
	type: "alert" | "info";
	expiresAt?: Date;
};

// Extend Hono's context to include custom variables set by middleware
declare module "hono" {
	interface ContextVariableMap {
		user: User;
	}
}
