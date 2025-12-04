import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { StaffNotices } from "../../pages/staff/Notices";
import { hallRepository, noticeRepository } from "../../Repositories";
import { NoticeBoard } from "./components/NoticeBoard";

const app = new Hono();

// GET /notices - Show notices page
app.get("/", async (c) => {
	const user = c.get("user") as User;

	if (user.role === "staff" || user.role === "manager") {
		// Staff/Manager sees notices for their hall (exclude global notices)
		const notices = await noticeRepository.getActiveNotices(user.hallId, false);
		const halls: Hall[] = []; // Staff/Manager doesn't need hall selector
		return c.html(<StaffNotices user={user} notices={notices} halls={halls} />);
	}

	if (user.role === "admin") {
		// Admin sees all notices with ability to filter and manage
		const hallFilter = c.req.query("hallId");
		const hallId = hallFilter ? Number(hallFilter) : undefined;
		const notices = await noticeRepository.getActiveNotices(hallId);
		const halls = await hallRepository.getAllHalls();
		return c.html(<StaffNotices user={user} notices={notices} halls={halls} selectedHallId={hallId} />);
	}

	// Student logic
	// Get filter from query params
	const hallFilter = c.req.query("hallId");
	const hallId = hallFilter ? Number(hallFilter) : undefined;

	// Fetch active notices
	const notices = await noticeRepository.getActiveNotices(hallId);

	// Fetch all halls for the filter dropdown
	const halls = await hallRepository.getAllHalls();

	return c.html(
		<DashboardLayout user={user} currentPath="/notices">
			<NoticeBoard notices={notices} halls={halls} selectedHallId={hallId} />
		</DashboardLayout>,
	);
});

// POST /notices - Create a new notice
app.post("/", async (c) => {
	const user = c.get("user") as User;
	const body = await c.req.parseBody();
	const title = String(body.title);
	const content = String(body.content);
	const priority = String(body.priority); // "low" | "medium" | "high" | "urgent"

	// For staff/manager, force hallId to their hall. For admins, allow selection.
	const hallId =
		user.role === "staff" || user.role === "manager"
			? user.hallId
			: body.hallId
				? Number(body.hallId)
				: undefined;

	// Map priority to type (alert | info)
	const type = priority === "urgent" || priority === "high" ? "alert" : "info";

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

// GET /notices/:id/edit - Get edit form
app.get("/:id/edit", async (c) => {
	const id = Number(c.req.param("id"));
	const user = c.get("user") as User;
	const notice = await noticeRepository.getNoticeById(id);

	if (!notice) {
		return c.text("Notice not found", 404);
	}

	// Check permission - admins can edit any notice, staff/manager only their hall's
	if ((user.role === "staff" || user.role === "manager") && notice.hallId !== user.hallId) {
		return c.text("Unauthorized", 403);
	}
	if (user.role !== "admin" && user.role !== "staff" && user.role !== "manager") {
		return c.text("Unauthorized", 403);
	}

	return c.html(
		<div class="w-full max-w-lg bg-white rounded-xl overflow-hidden">
			<div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
				<h3 class="font-bold text-lg text-slate-900">Edit Notice</h3>
				<form method="dialog">
					<button
						type="submit"
						class="text-slate-400 hover:text-slate-600 transition-colors"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Close</title>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</form>
			</div>
			<form action={`/notices/${id}`} method="post" class="p-6 space-y-4">
				<input type="hidden" name="_method" value="PUT" />
				<div>
					<label
						for="edit-title"
						class="block text-sm font-medium text-slate-700 mb-1"
					>
						Title
					</label>
					<input
						id="edit-title"
						type="text"
						name="title"
						value={notice.title}
						required
						class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
					/>
				</div>

				<div>
					<span class="block text-sm font-medium text-slate-700 mb-1">
						Type
					</span>
					<div class="flex gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="priority"
								value="info"
								checked={notice.type === "info"}
								class="text-blue-600 focus:ring-blue-500"
							/>
							<span class="text-sm text-slate-600">Information</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="priority"
								value="urgent"
								checked={notice.type === "alert"}
								class="text-red-600 focus:ring-red-500"
							/>
							<span class="text-sm text-slate-600">Alert / Urgent</span>
						</label>
					</div>
				</div>

				<div>
					<label
						for="edit-content"
						class="block text-sm font-medium text-slate-700 mb-1"
					>
						Content
					</label>
					<textarea
						id="edit-content"
						name="content"
						required
						rows={4}
						class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
					>
						{notice.content}
					</textarea>
				</div>

				<div class="pt-2 flex justify-end gap-3">
					<form method="dialog">
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
						>
							Cancel
						</button>
					</form>
					<button
						type="submit"
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all"
					>
						Save Changes
					</button>
				</div>
			</form>
		</div>,
	);
});

// PUT /notices/:id - Update a notice
app.post("/:id", async (c) => {
	const _method = (await c.req.parseBody())._method;
	if (_method !== "PUT") {
		return c.text("Method not allowed", 405);
	}

	const id = Number(c.req.param("id"));
	const user = c.get("user") as User;
	const body = await c.req.parseBody();

	const notice = await noticeRepository.getNoticeById(id);
	if (!notice) return c.text("Notice not found", 404);

	// Check permission - admins can update any notice, staff/manager only their hall's
	if ((user.role === "staff" || user.role === "manager") && notice.hallId !== user.hallId) {
		return c.text("Unauthorized", 403);
	}
	if (user.role !== "admin" && user.role !== "staff" && user.role !== "manager") {
		return c.text("Unauthorized", 403);
	}

	const title = String(body.title);
	const content = String(body.content);
	const priority = String(body.priority);
	const type = priority === "urgent" || priority === "high" ? "alert" : "info";

	await noticeRepository.updateNotice(id, {
		title,
		content,
		type,
	});

	return c.redirect("/notices");
});

// DELETE /notices/:id - Delete a notice
app.delete("/:id", async (c) => {
	const id = Number(c.req.param("id"));
	const user = c.get("user") as User;

	const notice = await noticeRepository.getNoticeById(id);
	if (!notice) return c.body(null, 404);

	// Check permission - admins can delete any notice, staff/manager only their hall's
	if ((user.role === "staff" || user.role === "manager") && notice.hallId !== user.hallId) {
		return c.text("Unauthorized", 403);
	}
	if (user.role !== "admin" && user.role !== "staff" && user.role !== "manager") {
		return c.text("Unauthorized", 403);
	}

	await noticeRepository.deleteNotice(id);
	return c.body(null, 200);
});

export default app;
