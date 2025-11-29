import { DashboardLayout } from "../../layouts";

interface StaffNoticesProps {
	user: User;
	notices: Notice[];
}

export function StaffNotices({ user, notices }: StaffNoticesProps) {
	return (
		<DashboardLayout user={user} currentPath="/notices">
			<div class="p-6 max-w-5xl mx-auto">
				<div class="flex items-center justify-between mb-8">
					<div>
						<h1 class="text-2xl font-bold text-slate-900">Hall Notices</h1>
						<p class="text-sm text-slate-500 mt-1">
							Manage notices for {user.hallName || "your hall"}
						</p>
					</div>
					<button
						type="button"
						class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
						onclick="openCreateModal()"
					>
						<svg
							class="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Create Notice</title>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						New Notice
					</button>
				</div>

				{/* Notices List */}
				<div class="space-y-4">
					{notices.length > 0 ? (
						notices.map((notice) => (
							<div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
								<div class="flex justify-between items-start mb-4">
									<div>
										<div class="flex items-center gap-2 mb-1">
											<span
												class={`px-2 py-0.5 text-xs font-medium rounded-full ${
													notice.type === "alert"
														? "bg-red-100 text-red-700"
														: "bg-blue-100 text-blue-700"
												}`}
											>
												{notice.type === "alert" ? "Alert" : "Info"}
											</span>
											<span class="text-xs text-slate-500">
												{new Date(notice.publishedAt).toLocaleDateString()}
											</span>
										</div>
										<h3 class="text-lg font-semibold text-slate-900">
											{notice.title}
										</h3>
									</div>
									<div class="flex items-center gap-2">
										<button
											type="button"
											class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
											hx-get={`/notices/${notice.id}/edit`}
											hx-target="#edit-modal-content"
											onclick="openEditModal()"
										>
											<svg
												class="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>Edit Notice</title>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
										<button
											type="button"
											class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
											hx-delete={`/notices/${notice.id}`}
											hx-confirm="Are you sure you want to delete this notice?"
											hx-target="closest div.bg-white"
											hx-swap="outerHTML"
										>
											<svg
												class="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>Delete Notice</title>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												/>
											</svg>
										</button>
									</div>
								</div>
								<p class="text-slate-600 whitespace-pre-wrap">
									{notice.content}
								</p>
							</div>
						))
					) : (
						<div class="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
							<div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
								<svg
									class="w-6 h-6 text-slate-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>No Notices</title>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
									/>
								</svg>
							</div>
							<h3 class="text-sm font-medium text-slate-900">No notices yet</h3>
							<p class="text-sm text-slate-500 mt-1">
								Create your first notice to keep residents informed.
							</p>
						</div>
					)}
				</div>

				{/* Create Notice Modal */}
				<dialog
					id="create-notice-modal"
					class="rounded-xl shadow-xl p-0 backdrop:bg-slate-900/50"
				>
					<div class="w-full max-w-lg bg-white rounded-xl overflow-hidden">
						<div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
							<h3 class="font-bold text-lg text-slate-900">
								Create New Notice
							</h3>
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
						<form action="/notices" method="post" class="p-6 space-y-4">
							<div>
								<label
									for="title-input"
									class="block text-sm font-medium text-slate-700 mb-1"
								>
									Title
								</label>
								<input
									id="title-input"
									type="text"
									name="title"
									required
									class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
									placeholder="e.g., Water Maintenance"
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
											checked
											class="text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm text-slate-600">Information</span>
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="radio"
											name="priority"
											value="urgent"
											class="text-red-600 focus:ring-red-500"
										/>
										<span class="text-sm text-slate-600">Alert / Urgent</span>
									</label>
								</div>
							</div>

							<div>
								<label
									for="content-input"
									class="block text-sm font-medium text-slate-700 mb-1"
								>
									Content
								</label>
								<textarea
									id="content-input"
									name="content"
									required
									rows={4}
									class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
									placeholder="Enter the details of the notice..."
								></textarea>
							</div>

							<div class="pt-2 flex justify-end">
								<button
									type="submit"
									class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all"
								>
									Post Notice
								</button>
							</div>
						</form>
					</div>
				</dialog>

				{/* Edit Notice Modal */}
				<dialog
					id="edit-notice-modal"
					class="rounded-xl shadow-xl p-0 backdrop:bg-slate-900/50"
				>
					<div
						id="edit-modal-content"
						class="w-full max-w-lg bg-white rounded-xl overflow-hidden"
					>
						{/* Content will be loaded here via HTMX */}
						<div class="p-12 text-center">
							<div class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
						</div>
					</div>
				</dialog>

				<script
					dangerouslySetInnerHTML={{
						__html: `
					function openCreateModal() {
						const modal = document.getElementById('create-notice-modal');
						if (modal) modal.showModal();
					}
					function openEditModal() {
						const modal = document.getElementById('edit-notice-modal');
						if (modal) modal.showModal();
					}
				`,
					}}
				/>
			</div>
		</DashboardLayout>
	);
}
