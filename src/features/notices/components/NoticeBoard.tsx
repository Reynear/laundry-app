import { NoticeCard } from "../../dashboard/components/DashboardComponents";

export function NoticeBoard({
	notices,
	halls,
	selectedHallId,
}: {
	notices: Notice[];
	halls: Hall[];
	selectedHallId?: number;
}) {
	return (
		<main class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
			{/* Filter Section */}
			<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<label for="hall-selector" class="flex items-center gap-3 mb-4">
					<svg
						class="w-6 h-6 text-slate-700"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Filter Icon</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
						/>
					</svg>
					<h2 class="text-lg font-bold text-gray-900">Filter by Hall</h2>
				</label>

				<select
					id="hall-selector"
					name="hallId"
					class="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-100 transition-all"
					hx-get="/notices"
					hx-target="body"
					hx-push-url="true"
					hx-trigger="change"
				>
					<option value="" selected={!selectedHallId}>
						All Halls
					</option>
					{halls.map((hall) => (
						<option value={hall.id} selected={selectedHallId === hall.id}>
							{hall.name}
						</option>
					))}
				</select>
			</div>

			{/* Notices List Section */}
			<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-bold text-slate-900">Recent Notices</h2>
				</div>

				{notices.length > 0 ? (
					<div class="space-y-4">
						{notices.map((notice) => (
							<NoticeCard
								key={notice.id}
								type={notice.type}
								title={notice.title}
								description={notice.content}
								hallName={notice.hallName || "General"}
								time={new Date(notice.publishedAt).toLocaleString()}
							/>
						))}
					</div>
				) : (
					<div class="text-center py-12">
						<p class="text-slate-500">No active notices</p>
					</div>
				)}
			</div>
		</main>
	);
}
