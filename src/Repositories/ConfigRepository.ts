import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { machines } from "../db/schema/schema";

/**
 * Repository for app configuration and pricing
 * Prices are derived from the machines table
 */
class ConfigRepository {
	/**
	 * Get the standard price for a machine type (global fallback)
	 * Returns the price from the first available machine of that type
	 */
	async getPriceByMachineType(type: MachineType): Promise<number> {
		const rows = await db
			.select({ pricePerCycle: machines.pricePerCycle })
			.from(machines)
			.where(eq(machines.type, type))
			.limit(1);

		if (rows.length === 0 || !rows[0].pricePerCycle) {
			// Fallback defaults if no machines exist
			return type === "washer" ? 0.0 : 0.0;
		}

		return Number.parseFloat(rows[0].pricePerCycle);
	}

	/**
	 * Get price for a specific machine type in a specific hall
	 */
	async getPriceByHallAndType(
		hallId: number,
		type: MachineType,
	): Promise<number> {
		const rows = await db
			.select({ pricePerCycle: machines.pricePerCycle })
			.from(machines)
			.where(and(eq(machines.hallId, hallId), eq(machines.type, type)))
			.limit(1);

		if (rows.length === 0 || !rows[0].pricePerCycle) {
			// Fallback to global price if no machines in this hall
			return this.getPriceByMachineType(type);
		}

		return Number.parseFloat(rows[0].pricePerCycle);
	}

	/**
	 * Get all service prices (global fallback)
	 */
	async getPrices(): Promise<{ washer: number; dryer: number }> {
		const [washerPrice, dryerPrice] = await Promise.all([
			this.getPriceByMachineType("washer"),
			this.getPriceByMachineType("dryer"),
		]);

		return {
			washer: washerPrice,
			dryer: dryerPrice,
		};
	}

	/**
	 * Get all service prices for a specific hall
	 */
	async getPricesByHall(
		hallId: number,
	): Promise<{ washer: number; dryer: number }> {
		const [washerPrice, dryerPrice] = await Promise.all([
			this.getPriceByHallAndType(hallId, "washer"),
			this.getPriceByHallAndType(hallId, "dryer"),
		]);

		return {
			washer: washerPrice,
			dryer: dryerPrice,
		};
	}
}

// Export singleton instance
export const configRepository = new ConfigRepository();
