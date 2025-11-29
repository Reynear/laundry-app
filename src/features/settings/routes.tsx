import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { Settings } from "../../pages/client/Settings";

const app = new Hono();

app.get("/", async (c) => {
	const user = c.get("user") as User;

	return c.html(
		<DashboardLayout user={user} currentPath="/settings">
			<Settings/>
		</DashboardLayout>,
	);
});

export default app;
