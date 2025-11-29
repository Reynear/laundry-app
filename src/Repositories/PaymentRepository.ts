import { eq } from "drizzle-orm";
import { db } from "../db";
import { payments, users } from "../db/schema/schema";

export class PaymentRepository {
	/**
	 * Get the current wallet balance for a user
	 */
	async getUserBalance(userId: number): Promise<number> {
		const rows = await db
			.select({ walletBalance: users.walletBalance })
			.from(users)
			.where(eq(users.id, userId));

		if (rows.length === 0) {
			throw new Error(`User with ID ${userId} not found`);
		}

		return rows[0].walletBalance ? parseFloat(rows[0].walletBalance) : 0;
	}

	/**
	 * Check if a user has enough credits for a given amount
	 */
	async hasEnoughCredits(userId: number, amount: number): Promise<boolean> {
		const balance = await this.getUserBalance(userId);
		return balance >= amount;
	}

	/**
	 * Deduct credits from a user's wallet when an appointment is completed
	 * Records the transaction in the payments table
	 */
	async deductCredits(
		userId: number,
		amount: number,
		appointmentId?: number,
	): Promise<{ success: boolean; newBalance: number }> {
		const currentBalance = await this.getUserBalance(userId);

		if (currentBalance < amount) {
			throw new Error(
				`Insufficient credits. Current balance: ${currentBalance}, required: ${amount}`,
			);
		}

		const newBalance = currentBalance - amount;

		// Update user's wallet balance
		await db
			.update(users)
			.set({
				walletBalance: newBalance.toFixed(2),
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		// Record the payment/deduction transaction
		await db.insert(payments).values({
			userId,
			amount: (-amount).toFixed(2), // Negative for deductions
			currency: "USD",
			status: "succeeded",
			stripePaymentId: appointmentId
				? `appointment_${appointmentId}`
				: `deduction_${Date.now()}`,
		});

		return { success: true, newBalance };
	}

	/**
	 * Add credits to a user's wallet (for top-ups)
	 * Records the transaction in the payments table
	 */
	async addCredits(
		userId: number,
		amount: number,
		stripePaymentId?: string,
	): Promise<{ success: boolean; newBalance: number }> {
		const currentBalance = await this.getUserBalance(userId);
		const newBalance = currentBalance + amount;

		// Update user's wallet balance
		await db
			.update(users)
			.set({
				walletBalance: newBalance.toFixed(2),
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		// Record the payment transaction
		await db.insert(payments).values({
			userId,
			amount: amount.toFixed(2),
			currency: "USD",
			status: "succeeded",
			stripePaymentId: stripePaymentId || `topup_${Date.now()}`,
		});

		return { success: true, newBalance };
	}

	/**
	 * Record a payment transaction (for manual logging)
	 */
	async recordPayment(data: {
		userId: number;
		amount: number;
		currency?: string;
		status?: "pending" | "succeeded" | "failed";
		stripePaymentId?: string;
	}): Promise<number> {
		const [payment] = await db
			.insert(payments)
			.values({
				userId: data.userId,
				amount: data.amount.toFixed(2),
				currency: data.currency || "USD",
				status: data.status || "pending",
				stripePaymentId: data.stripePaymentId,
			})
			.returning({ id: payments.id });

		return payment.id;
	}

	/**
	 * Validate that a user can book an appointment with the given cost
	 * Returns validation result with current balance info
	 */
	async validateBookingCredits(
		userId: number,
		appointmentCost: number,
	): Promise<{
		canBook: boolean;
		currentBalance: number;
		shortfall: number;
	}> {
		const currentBalance = await this.getUserBalance(userId);
		const canBook = currentBalance >= appointmentCost;
		const shortfall = canBook ? 0 : appointmentCost - currentBalance;

		return {
			canBook,
			currentBalance,
			shortfall,
		};
	}
}

export const paymentRepository = new PaymentRepository();
