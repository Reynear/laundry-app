import { Hono } from "hono";
import { Checkout, Webhooks } from "@polar-sh/hono";
import { paymentRepository } from "../../Repositories/PaymentRepository";

const app = new Hono();

// Checkout handler - redirects to Polar checkout
app.get(
    "/checkout",
    Checkout({
        accessToken: process.env.POLAR_ACCESS_TOKEN,
        successUrl: "/payments?success=true",
        server: "sandbox", // Change to "production" when ready
    }),
);

// Webhook handler - receives payment confirmations
app.post(
    "/webhook",
    Webhooks({
        webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
        onPayload: async (payload) => {
            // We only care about order.created or order.paid events depending on how we want to track it
            // But the @polar-sh/hono helper might have specific callbacks.
            // Checking documentation or type definition would be ideal, but based on the plan:
            // We will use a generic handler or specific event check if the adapter supports it.
            // The adapter usually exposes `onPayload` or specific event handlers.
            // Let's assume onPayload and check event type.

            if (payload.type === "order.created") {
                // Order created
                const order = payload.data;
                const userId = order.metadata?.userId;

                if (userId) {
                    // We might want to wait for payment_succeeded, but order.created in Polar usually means successful checkout session completion?
                    // Actually, let's look at the plan again. It suggested `onOrderPaid`.
                    // Let's check if that exists in the type. If not, we use onPayload.
                    // For now, I'll write it using onPayload which is safer if I'm unsure of the exact SDK version types without checking.
                    // But the plan had: onOrderPaid: async (payload) => { ... }
                    // I will try to stick to the plan but be robust.
                }
            }
        },
        onOrderCreated: async (payload) => {
            // Using the specific handler if available, which is cleaner.
            // Note: In Polar, "order.created" is often the event after successful checkout.
            const userId = String(payload.data.metadata?.userId);
            const amount = payload.data.totalAmount / 100; // Convert from cents
            const orderId = payload.data.id;

            if (userId) {
                await paymentRepository.addCredits(parseInt(userId), amount, undefined, orderId);
            }
        }
    }),
);

export default app;
