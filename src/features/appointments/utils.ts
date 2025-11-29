/**
 * Pure utility functions for appointments feature.
 * These functions have no database dependencies.
 */

/**
 * Generates an array of the next 7 days starting from the given date.
 */
export function generateNext7Days(startDate: Date): Date[] {
	const dates = [];
	for (let i = 0; i < 7; i++) {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		dates.push(date);
	}
	return dates;
}

/**
 * Formats a number as a currency string (JMD).
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-JM", {
		style: "currency",
		currency: "JMD",
	}).format(amount);
}
