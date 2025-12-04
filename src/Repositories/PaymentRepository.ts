import { eq } from "drizzle-orm";
import { db } from "../db";
import { payments, users } from "../db/schema/schema";

class PaymentRepository {
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
	 * Add credits from Stripe payment (webhook)
	 * Checks for idempotency using stripePaymentId
	 */
	async addCreditsFromStripe(
		stripePaymentId: string,
		amountCents: number,
		userId: number,
	): Promise<{ success: boolean; newBalance: number; alreadyProcessed: boolean }> {
		// Check if payment already exists
		const existingPayment = await db
			.select()
			.from(payments)
			.where(eq(payments.stripePaymentId, stripePaymentId));

		if (existingPayment.length > 0) {
			const currentBalance = await this.getUserBalance(userId);
			return {
				success: true,
				newBalance: currentBalance,
				alreadyProcessed: true,
			};
		}

		const amount = amountCents / 100;
		return {
			...(await this.addCredits(userId, amount, stripePaymentId)),
			alreadyProcessed: false,
		};
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
