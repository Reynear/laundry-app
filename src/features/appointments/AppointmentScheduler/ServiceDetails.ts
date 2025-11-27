import { getMachineDuration } from "./SlotValidator";

export type ServiceDetailsResult = {
  label: string;
  price: number;
  duration: number;
};

/**
 * Gets service details including label, price, and DB-backed duration.
 * @param hallId - Hall ID to fetch machine durations from
 * @param type - Service type
 * @param washerPrice - Price per washer cycle
 * @param dryerPrice - Price per dryer cycle
 */
export async function getServiceDetails(
  hallId: number,
  type: "wash" | "dry" | "wash_dry" | null | undefined,
  washerPrice: number,
  dryerPrice: number,
): Promise<ServiceDetailsResult> {
  if (!type) {
    return { label: "Not selected", price: 0, duration: 0 };
  }

  // Fetch actual durations from database
  const washDuration = await getMachineDuration(hallId, "washer");
  const dryDuration = await getMachineDuration(hallId, "dryer");

  switch (type) {
    case "wash":
      return {
        label: "Wash Only",
        price: washerPrice,
        duration: washDuration, // DB-backed duration
      };
    case "dry":
      return {
        label: "Dry Only",
        price: dryerPrice,
        duration: dryDuration, // DB-backed duration
      };
    case "wash_dry":
      return {
        label: "Wash & Dry",
        price: washerPrice + dryerPrice,
        duration: washDuration + dryDuration, // Sum of both DB durations
      };
  }
}

/**
 * Synchronous version for use in components where duration is already known.
 * This is a lighter alternative when durations have been pre-fetched.
 */
export function getServiceDetailsSync(
  type: "wash" | "dry" | "wash_dry" | null | undefined,
  washerPrice: number,
  dryerPrice: number,
  washDuration: number,
  dryDuration: number,
): ServiceDetailsResult {
  if (!type) {
    return { label: "Not selected", price: 0, duration: 0 };
  }

  switch (type) {
    case "wash":
      return {
        label: "Wash Only",
        price: washerPrice,
        duration: washDuration,
      };
    case "dry":
      return {
        label: "Dry Only",
        price: dryerPrice,
        duration: dryDuration,
      };
    case "wash_dry":
      return {
        label: "Wash & Dry",
        price: washerPrice + dryerPrice,
        duration: washDuration + dryDuration,
      };
  }
}
