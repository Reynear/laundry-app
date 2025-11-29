import { formatCurrency } from "@/features/appointments/utils";

export function Payments({ user }: { user: User }) {
	return (
		<div class="p-6">
			<div class="max-w-4xl mx-auto">
				<h1 class="text-3xl font-bold text-gray-900 mb-6">Payments</h1>

				<div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
					<div class="space-y-4">
						<div class="flex justify-between items-center pb-4 border-b border-slate-200">
							<span class="text-gray-600">Current Balance</span>
							<span class="text-2xl font-bold text-gray-900">
								{formatCurrency(user.walletBalance)}
							</span>
						</div>

						<div class="py-4">
							<h2 class="text-lg font-semibold text-gray-900 mb-4">
								Top Up Balance
							</h2>
							<form class="flex gap-3">
								<input
									type="number"
									name="amount"
									min="100"
									step="50"
									placeholder="Enter amount"
									class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
								/>
								<button
									type="submit"
									class="px-6 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
								>
									Top Up
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
