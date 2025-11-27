import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { Payments } from "../../pages/client/Payments";

const app = new Hono();

app.get("/", async (c) => {
	const user = c.get("user") as User;

	return c.html(
		<DashboardLayout user={user} currentPath="/payments">
			<Payments user={user} />
		</DashboardLayout>,
	);
});

export default app;
