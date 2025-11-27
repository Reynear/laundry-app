import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { hallRepository, noticeRepository } from "../../Repositories";
import { NoticeBoard } from "./components/NoticeBoard";

const app = new Hono();

// GET /notices - Show notices page
app.get("/", async (c) => {
	const user = c.get("user") as User;

	// Get filter from query params
	const hallFilter = c.req.query("hallId");
	const hallId = hallFilter ? Number(hallFilter) : undefined;

	// Fetch active notices
	const notices = await noticeRepository.getActiveNotices(hallId);

	// Fetch all halls for the filter dropdown
	const halls = await hallRepository.getAllHalls();


	return c.html(
		<DashboardLayout user={user} currentPath="/notices">
			<NoticeBoard
				notices={notices}
				userRole={user.role}
				halls={halls}
				selectedHallId={hallId}
			/>
		</DashboardLayout>,
	);
});

// POST /notices - Create a new notice
app.post("/", async (c) => {
	const body = await c.req.parseBody();
	const title = String(body.title);
	const content = String(body.content);
	const priority = String(body.priority); // "low" | "medium" | "high" | "urgent"
	const hallId = body.hallId ? Number(body.hallId) : undefined;

	// Map priority to type (alert | info)
	const type = priority === "urgent" || priority === "high" ? "alert" : "info";

	const user = c.get("user") as User;

	try {
		await noticeRepository.createNotice({
			title,
			content,
			type,
			authorUserId: user.id,
			hallId,
			isPublished: true,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
		});

		return c.redirect("/notices");
	} catch (error) {
		console.error("Failed to create notice:", error);
		return c.text("Failed to create notice", 500);
	}
});

// DELETE /notices/:id - Delete a notice
app.delete("/:id", async (c) => {
	const id = Number(c.req.param("id"));
	await noticeRepository.deleteNotice(id);
	return c.body(null, 200);
});

export default app;
