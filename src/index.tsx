import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import appointments from "./features/appointments/routes";
import auth from "./features/auth/api";
import authPages from "./features/auth/routes";
import dashboard from "./features/dashboard/routes";
import notices from "./features/notices/routes";
import payments from "./features/payments/routes";
import settings from "./features/settings/routes";
import { userRepository } from "./Repositories/UserRepository";

const app = new Hono();

// Serve static files
app.use("/output.css", serveStatic({ path: "./src/output.css" }));
app.use(
	"/bookingScript.js",
	serveStatic({ path: "./src/features/appointments/bookingScript.js" }),
);

// Public Routes
app.route("/api", auth);
app.route("/", authPages);

// Auth Middleware
const authMiddleware = createMiddleware(async (c, next) => {
	const sessionId = await getSignedCookie(
		c,
		process.env.SESSION_SECRET || "secret",
		"sessionId",
	);

	if (!sessionId) {
		return c.redirect("/login");
	}

	const user = await userRepository.getUserById(parseInt(sessionId, 10));

	if (!user) {
		return c.redirect("/login");
	}

	c.set("user", user);
	await next();
});

// Protected Routes
app.use("/dashboard/*", authMiddleware);
app.use("/appointments/*", authMiddleware);
app.use("/notices/*", authMiddleware);
app.use("/payments/*", authMiddleware);
app.use("/settings/*", authMiddleware);

app.route("/dashboard", dashboard);
app.route("/appointments", appointments);
app.route("/notices", notices);
app.route("/payments", payments);
app.route("/settings", settings);

app.get("/", async (c) => {
	const sessionId = await getSignedCookie(
		c,
		process.env.SESSION_SECRET || "secret",
		"sessionId",
	);
	if (sessionId) {
		return c.redirect("/dashboard");
	} else {
		return c.redirect("/login");
	}
});

export default app;
