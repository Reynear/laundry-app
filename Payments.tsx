import { formatCurrency } from "@/features/appointments/utils";

export function Payments({
	user,
	success,
	error,
}: { user: User; success?: string; error?: string }) {
	// Query params passed from server route handler


	return (
		<div class="p-6">
			<div class="max-w-4xl mx-auto">
				<h1 class="text-3xl font-bold text-gray-900 mb-6">Payments</h1>

				{success && (
					<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
						Payment successful! Your balance has been updated.
					</div>
				)}

				{error && (
					<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
						Payment failed or was cancelled. Please try again.
					</div>
				)}

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
							<p class="text-slate-600 mb-4">
								You will be redirected to our secure payment partner (Polar) to complete your purchase.
							</p>
							<div class="flex gap-3">
								<a
									href="https://buy.polar.sh/polar_cl_KWgo0ZdcEYiu0pmowBFxKiljv72f8mncYhfyA2I7wqk"
									class="px-6 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors inline-block"
								>
									Top Up Credits
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
