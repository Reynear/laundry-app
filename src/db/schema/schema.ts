import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
	"student",
	"staff",
	"manager",
	"admin",
]);
export const machineTypeEnum = pgEnum("machine_type", ["washer", "dryer"]);
export const machineStatusEnum = pgEnum("machine_status", [
	"available",
	"in_use",
	"out_of_service",
	"maintenance",
]);
export const serviceTypeEnum = pgEnum("service_type", ["wash", "dry"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
	"pending",
	"confirmed",
	"in_progress",
	"completed",
	"cancelled",
	"no_show",
]);
export const sessionStatusEnum = pgEnum("session_status", [
	"running",
	"completed",
	"cancelled",
]);
export const noticeTypeEnum = pgEnum("notice_type", ["alert", "info"]);
export const shiftStatusEnum = pgEnum("shift_status", [
	"scheduled",
	"completed",
	"absent",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
	"pending",
	"succeeded",
	"failed",
]);

// Users & Auth
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: userRoleEnum("role").default("student"),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	hallId: integer("hall_id"), // FK added in relations
	walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default(
		"0",
	),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Facilities
export const halls = pgTable("halls", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	openingTime: varchar("opening_time", { length: 5 }), // e.g., "08:00"
	closingTime: varchar("closing_time", { length: 5 }), // e.g., "22:00"
	washerPrice: decimal("washer_price", { precision: 10, scale: 2 }).default(
		"0",
	),
	dryerPrice: decimal("dryer_price", { precision: 10, scale: 2 }).default("0"),
});

export const machines = pgTable("machines", {
	id: serial("id").primaryKey(),
	hallId: integer("hall_id").notNull(), // FK added in relations
	type: machineTypeEnum("type").notNull(),
	status: machineStatusEnum("status").default("available"),
	durationMins: integer("duration_mins").default(45),
});

// Appointments & Sessions
export const appointments = pgTable("appointments", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull(), // FK added in relations
	hallId: integer("hall_id").notNull(), // FK added in relations
	machineId: integer("machine_id"), // FK added in relations, nullable
	appointmentDatetime: timestamp("appointment_datetime").notNull(),
	durationMins: integer("duration_mins").notNull(),
	serviceType: serviceTypeEnum("service_type").notNull(),
	status: appointmentStatusEnum("status").default("pending"),
	totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	cancelledAt: timestamp("cancelled_at"),
});

export const machineSessions = pgTable("machine_sessions", {
	id: serial("id").primaryKey(),
	machineId: integer("machine_id").notNull(), // FK added in relations
	appointmentId: integer("appointment_id"), // FK added in relations, nullable
	startedByUserId: integer("started_by_user_id").notNull(), // FK added in relations
	startTime: timestamp("start_time").notNull(),
	expectedEndTime: timestamp("expected_end_time").notNull(),
	actualEndTime: timestamp("actual_end_time"),
	status: sessionStatusEnum("status").default("running"),
});

// Notices
export const notices = pgTable("notices", {
	id: serial("id").primaryKey(),
	authorUserId: integer("author_user_id").notNull(), // FK added in relations
	hallId: integer("hall_id"), // FK added in relations, nullable (global)
	title: varchar("title", { length: 255 }).notNull(),
	content: text("content").notNull(),
	isPublished: boolean("is_published").default(false),
	publishedAt: timestamp("published_at"),
	expiresAt: timestamp("expires_at"),
	type: noticeTypeEnum("type").default("info"),
});

// Staff Scheduling
export const shifts = pgTable("shifts", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull(), // FK added in relations
	hallId: integer("hall_id").notNull(), // FK added in relations
	startTime: timestamp("start_time").notNull(),
	endTime: timestamp("end_time").notNull(),
	status: shiftStatusEnum("status").default("scheduled"),
});

// Payments
export const payments = pgTable("payments", {
	id: serial("id").primaryKey(),
	userId: integer("user_id").notNull(), // FK added in relations
	amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
	currency: varchar("currency", { length: 3 }).default("USD"),
	status: paymentStatusEnum("status").default("pending"),
	stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
	hall: one(halls, {
		fields: [users.hallId],
		references: [halls.id],
	}),
	appointments: many(appointments),
	shifts: many(shifts),
	payments: many(payments),
	notices: many(notices),
}));

export const hallsRelations = relations(halls, ({ many }) => ({
	users: many(users),
	machines: many(machines),
	appointments: many(appointments),
	shifts: many(shifts),
	notices: many(notices),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
	hall: one(halls, {
		fields: [machines.hallId],
		references: [halls.id],
	}),
	appointments: many(appointments),
	sessions: many(machineSessions),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
	user: one(users, {
		fields: [appointments.userId],
		references: [users.id],
	}),
	hall: one(halls, {
		fields: [appointments.hallId],
		references: [halls.id],
	}),
	machine: one(machines, {
		fields: [appointments.machineId],
		references: [machines.id],
	}),
}));

export const machineSessionsRelations = relations(
	machineSessions,
	({ one }) => ({
		machine: one(machines, {
			fields: [machineSessions.machineId],
			references: [machines.id],
		}),
		appointment: one(appointments, {
			fields: [machineSessions.appointmentId],
			references: [appointments.id],
		}),
		user: one(users, {
			fields: [machineSessions.startedByUserId],
			references: [users.id],
		}),
	}),
);

export const noticesRelations = relations(notices, ({ one }) => ({
	author: one(users, {
		fields: [notices.authorUserId],
		references: [users.id],
	}),
	hall: one(halls, {
		fields: [notices.hallId],
		references: [halls.id],
	}),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
	user: one(users, {
		fields: [shifts.userId],
		references: [users.id],
	}),
	hall: one(halls, {
		fields: [shifts.hallId],
		references: [halls.id],
	}),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
	user: one(users, {
		fields: [payments.userId],
		references: [users.id],
	}),
}));
