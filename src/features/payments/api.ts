import { Hono } from "hono";
import Stripe from "stripe";
import { paymentRepository } from "../../Repositories/PaymentRepository";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const app = new Hono();

console.log('=== ENV CHECK ===');
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_WEBHOOK_SECRET exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));

console.log('STRIPE_WEBHOOK_SECRET value:', `"${process.env.STRIPE_WEBHOOK_SECRET}"`);
console.log('Length:', process.env.STRIPE_WEBHOOK_SECRET?.length);
console.log('First 10 chars:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10));
console.log('Last 10 chars:', process.env.STRIPE_WEBHOOK_SECRET?.substring(process.env.STRIPE_WEBHOOK_SECRET.length - 10));

// Check for invisible characters
const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (secret) {
    console.log('Char codes:');
    for (let i = 0; i < Math.min(20, secret.length); i++) {
        console.log(`  [${i}]: '${secret[i]}' (${secret.charCodeAt(i)})`);
    }
}
// Checkout endpoint
app.post("/checkout", async (c) => {
    try {
        const body = await c.req.json();
        const { amount, userId } = body;

        if (!amount || !userId) {
            return c.json({ error: "Missing amount or userId" }, 400);
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Wallet Top-up",
                        },
                        unit_amount: Math.round(amount * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.APP_URL || "http://localhost:3000"}/payments?success=true`,
            cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/payments?canceled=true`,
            metadata: {
                userId: userId.toString(),
            },
        });

        return c.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe checkout error:", error);
        return c.json({ error: error.message }, 500);
    }
});


// Webhook endpoint
app.post("/api/webhook", async (c) => {
    try {
        const sig = c.req.header("stripe-signature");

        if (!sig) {
            return c.text('No stripe-signature header', 400);
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('STRIPE_WEBHOOK_SECRET is not set');
            return c.text('Webhook secret not configured', 500);
        }

        // Get raw body
        const rawBody = await c.req.raw.arrayBuffer();
        const payload = Buffer.from(rawBody).toString('utf8');

        //console.log('Webhook received - verifying signature...');

        let event;
        try {
            // IMPORTANT: Use constructEventAsync
            event = await stripe.webhooks.constructEventAsync(
                payload,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
            console.log('Webhook signature verified successfully');
        } catch (err: any) {
            console.error('Webhook verification failed:', err.message);
            return c.text(`Webhook Error: ${err.message}`, 400);
        }

        // Handle the event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId || session.client_reference_id;

            console.log('Processing checkout.session.completed:', {
                sessionId: session.id,
                userId,
                amount: session.amount_total
            });

            if (userId && session.amount_total) {
                try {
                    await paymentRepository.addCreditsFromStripe(
                        session.id,
                        session.amount_total,
                        parseInt(userId),
                    );
                    console.log('Successfully updated wallet for userId:', userId);
                } catch (repoError) {
                    console.error('Error updating payment repository:', repoError);
                    // Don't return error here - Stripe will retry
                }
            } else {
                console.warn('Missing userId or amount_total in session');
            }
        } else {
            //console.log(`Received unhandled event type: ${event.type}`);
        }

        return c.text("Received", 200);

    } catch (error: any) {
        console.error('Unexpected error in webhook handler:', error);
        return c.text('Internal Server Error', 500);
    }
});

export default app;
