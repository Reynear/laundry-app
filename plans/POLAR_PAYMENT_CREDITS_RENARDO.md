# Polar Integration for Payment Credits (Renardo) - Implementation Plan

## Overview

**Why Polar over Stripe:**
1. **Native Hono adapter** - `@polar-sh/hono` provides ready-made middleware for checkout, webhooks, and customer portal
2. **Merchant of Record** - Polar handles tax compliance (VAT, GST, sales tax) automatically
3. **Simpler integration** - ~50% less code than Stripe equivalent
4. **Ad-hoc pricing** - Perfect for dynamic credit amounts without pre-creating products
5. **Lower fees** - 4% + 40¢ vs Stripe's 2.9% + 30¢ + additional complexity costs
6. **Sandbox environment** - Free testing without test cards

### Current State (from codebase analysis)
- **Wallet System**: Users have `walletBalance` field in `users` table (decimal)
- **Payments Table**: Exists with `stripePaymentId` field (will repurpose for Polar)
- **PaymentRepository**: Has `addCredits()`, `deductCredits()`, `getUserBalance()` methods
- **Currency**: JMD (Jamaican Dollar)
- **Tech Stack**: Hono + Bun + Drizzle ORM + HTMX + PostgreSQL

---

## Implementation Plan

### Phase 1: Setup & Configuration (30 min)

#### Task 1.1: Install Polar SDK
```bash
bun add @polar-sh/hono @polar-sh/sdk zod
```

#### Task 1.2: Environment Variables
Add to `.env.example`:
```
POLAR_ACCESS_TOKEN=xxx
POLAR_WEBHOOK_SECRET=xxx
POLAR_ORGANIZATION_ID=xxx
```

#### Task 1.3: Create Polar Product in Dashboard
1. Sign up at polar.sh and create organization
2. Use **Sandbox** environment for development
3. Create a "Laundry Credits" product with:
   - One-time purchase
   - Pay-what-you-want pricing (min $100 JMD)
   - Or use ad-hoc pricing in API for complete flexibility

**Reasoning**: Polar dashboard setup is required first. Ad-hoc pricing allows dynamic amounts at checkout.

---

### Phase 2: Backend Integration (45 min)

#### Task 2.1: Create Polar Routes
Create `src/features/payments/api.ts`:

```typescript
import { Hono } from "hono";
import { Checkout, Webhooks } from "@polar-sh/hono";

const app = new Hono();

// Checkout handler - redirects to Polar checkout
app.get(
  "/checkout",
  Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    successUrl: "/payments?success=true",
    server: "sandbox", // Change to "production" when ready
  })
);

// Webhook handler - receives payment confirmations
app.post(
  "/webhook",
  Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    onOrderPaid: async (payload) => {
      // Extract userId from metadata and add credits
      const userId = payload.data.metadata?.userId;
      const amount = payload.data.amount / 100; // Convert from cents
      await paymentRepository.addCredits(userId, amount, payload.data.id);
    },
  })
);

export default app;
```

#### Task 2.2: Mount Routes in index.tsx
```typescript
import paymentsApi from "./features/payments/api";

// Public route for webhooks (no auth)
app.route("/api/payments", paymentsApi);
```

**Reasoning**: Polar's Hono adapter handles checkout redirects and webhook signature verification automatically.

---

### Phase 3: Frontend Updates (30 min)

#### Task 3.1: Update Payments Page
Enhance `src/pages/client/Payments.tsx`:
- Add preset amount buttons ($500, $1000, $2000, $5000 JMD)
- Custom amount input
- Link/button that redirects to `/api/payments/checkout?products=PRODUCT_ID&metadata={"userId":123}`
- Display success/cancelled messages from query params

#### Task 3.2: Handle Checkout Flow
The checkout flow:
1. User clicks "Top Up $1000"
2. Request to `/api/payments/checkout?products=xxx&amount=1000&customerEmail=user@email.com&metadata={"userId":123}`
3. Polar adapter redirects to Polar checkout page
4. User completes payment
5. Polar sends webhook to `/api/payments/webhook`
6. Credits added to user's wallet
7. User redirected to `/payments?success=true`

**Reasoning**: HTMX + server redirect works cleanly. Metadata passes userId for webhook handler.

---

### Phase 4: Database Updates (15 min)

#### Task 4.1: Schema Updates (Optional but Recommended)
Add to `src/db/schema/schema.ts`:
```typescript
// Add payment type enum
export const paymentTypeEnum = pgEnum("payment_type", ["topup", "deduction", "refund"]);

// Add to payments table
type: paymentTypeEnum("type").default("topup"),
polarOrderId: varchar("polar_order_id", { length: 255 }),
```

#### Task 4.2: Update PaymentRepository
Add method to check for duplicate orders (idempotency):
```typescript
async getPaymentByPolarOrderId(orderId: string): Promise<Payment | null>
```

**Reasoning**: Idempotency prevents duplicate credit additions if webhook fires multiple times.

---

### Phase 5: Transaction History (20 min)

#### Task 5.1: Add History Endpoint
Create `GET /payments/history` route that returns user's payment history.

#### Task 5.2: Create TransactionHistory Component
Show list of transactions with:
- Date
- Amount (+/-)
- Type (Top Up, Booking Deduction, Refund)
- Status

**Reasoning**: Users need transparency into their credit history.

---

## File Changes Summary

### New Files
1. `src/features/payments/api.ts` - Polar API routes (~40 lines)
2. `src/features/payments/components/TransactionHistory.tsx` (~60 lines)

### Modified Files
1. `.env.example` - Add Polar env vars
2. `package.json` - Add Polar dependencies
3. `src/index.tsx` - Mount payment API routes
4. `src/pages/client/Payments.tsx` - Enhanced UI
5. `src/Repositories/PaymentRepository.ts` - Add idempotency check
6. `src/db/schema/schema.ts` - Optional type enum

---

## Task Breakdown

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Install Polar SDK | High | 5 min |
| 2 | Add environment variables | High | 5 min |
| 3 | Create Polar product in dashboard | High | 10 min |
| 4 | Create checkout route | High | 15 min |
| 5 | Create webhook handler | High | 20 min |
| 6 | Mount routes in index.tsx | High | 5 min |
| 7 | Update Payments page UI | High | 30 min |
| 8 | Add idempotency check | Medium | 10 min |
| 9 | Schema updates (optional) | Low | 15 min |
| 10 | Transaction history | Low | 20 min |

**Total Estimated Effort: ~2-3 hours** (vs ~7-8 hours for Stripe)

---

## Polar vs Stripe Comparison

| Aspect | Polar | Stripe |
|--------|-------|--------|
| SDK/Adapter | `@polar-sh/hono` (native) | `stripe` (generic) |
| Checkout | 1 middleware function | Custom session creation |
| Webhooks | 1 middleware + handlers | Manual signature verification |
| Tax Handling | Automatic (MoR) | Manual or Stripe Tax add-on |
| Code Required | ~100 lines | ~300+ lines |
| Testing | Sandbox (free) | Test mode (free) |
| Fees | 4% + 40¢ | 2.9% + 30¢ + complexity |

---

## Notes

1. **Ad-hoc Pricing**: For custom amounts, use Polar's ad-hoc pricing API instead of fixed products
2. **Currency**: Verify JMD support in Polar (may need to use USD and convert)
3. **Customer Portal**: Polar provides a built-in customer portal if needed later
4. **Sandbox**: Use sandbox for all development, switch to production when ready

---

## Implementation Progress

- [ ] Phase 1: Setup & Configuration
  - [ ] Install Polar SDK
  - [ ] Add environment variables
  - [ ] Create Polar product in dashboard
- [ ] Phase 2: Backend Integration
  - [ ] Create checkout route
  - [ ] Create webhook handler
  - [ ] Mount routes
- [ ] Phase 3: Frontend Updates
  - [ ] Update Payments page UI
  - [ ] Handle success/cancel states
- [ ] Phase 4: Database Updates (Optional)
  - [ ] Schema updates
  - [ ] Idempotency check
- [ ] Phase 5: Transaction History (Optional)
  - [ ] History endpoint
  - [ ] TransactionHistory component

---

**Status**: Awaiting Review

**Last Updated**: 2024-11-28
