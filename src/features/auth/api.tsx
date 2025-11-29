import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { Alert } from "../../components/Alert";
import { db } from "../../db";
import { users } from "../../db/schema/schema";

const auth = new Hono();

function loginFailed(c: any, message: string = "Invalid email or password") {
	return c.html(
		<Alert
			type="error"
			title="Login Failed"
			description={message}
		/>,
	);
}

auth.post("/login", async (c) => {
	try {
		const formData = await c.req.formData();
		const email = formData.get("email");
		const password = formData.get("password");

		if (typeof email !== "string" || typeof password !== "string") {
			return loginFailed(c);
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			return loginFailed(c);
		}

		const ok = await Bun.password.verify(password, user.passwordHash);
		if (!ok) {
			return loginFailed(c);
		}

		await setSignedCookie(
			c,
			"sessionId",
			user.id.toString(),
			process.env.SESSION_SECRET || "secret", // Fallback for dev
			{
				httpOnly: true,
				secure: true,
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60,
				path: "/",
			},
		);

		if (user.role === "staff") {
			c.header("HX-Redirect", "/appointments?toast=login_success");
		} else {
			c.header("HX-Redirect", "/dashboard?toast=login_success");
		}
		return c.text("Redirecting...");
	} catch (e) {
		console.error(e);
		return loginFailed(c, "An error occurred");
	}
});

auth.post("/register", async (c) => {
	try {
		const formData = await c.req.formData();
		const email = formData.get("email") as string;
		const password = formData.get("password") as string; // In real app, validate this!
		const firstName = formData.get("firstName") as string;
		const lastName = formData.get("lastName") as string;
		const hallId = formData.get("hallId") ? parseInt(formData.get("hallId") as string) : undefined;

		if (!email || !password) {
			return c.html(
				<Alert type="error" title="Error" description="Email and password are required" />
			);
		}

		// Check existing
		const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (existing) {
			return c.html(
				<Alert type="error" title="Error" description="User already exists" />
			);
		}

		const passwordHash = await Bun.password.hash(password);

		await db.insert(users).values({
			email,
			passwordHash,
			firstName,
			lastName,
			hallId,
			role: "student",
			walletBalance: "0",
		});

		// Fetch the newly created user
		const [newUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

		if (!newUser) {
			return c.html(
				<Alert type="error" title="Error" description="Registration failed" />
			);
		}

		// Auto login
		await setSignedCookie(
			c,
			"sessionId",
			newUser.id.toString(),
			process.env.SESSION_SECRET || "secret",
			{
				httpOnly: true,
				secure: true,
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60,
				path: "/",
			},
		);

		c.header("HX-Redirect", "/dashboard?toast=welcome");
		return c.text("Redirecting...");

	} catch (e) {
		console.error(e);
		return c.html(
			<Alert type="error" title="Error" description="Registration failed" />
		);
	}
});

auth.get("/login/clear-alert", (c) => {
	return c.html(<div id="alert-slot"></div>);
});

auth.post("/logout", async (c) => {
	deleteCookie(c, "sessionId");
	return c.redirect("/login");
});

export default auth;
