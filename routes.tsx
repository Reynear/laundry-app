import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { Payments } from "../../pages/client/Payments";

const app = new Hono();

app.get("/", async (c) => {
	const user = c.get("user") as User;

	const success = c.req.query("success");
	const error = c.req.query("error");

	return c.html(
		<DashboardLayout user={user} currentPath="/payments">
			<Payments user={user} success={success} error={error} />
		</DashboardLayout>,
	);
});

export default app;
