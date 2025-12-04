import { formatCurrency } from "@/features/appointments/utils";

export function Payments({ user }: { user: User }) {
	return (
		<div class="p-6">
			<div class="max-w-4xl mx-auto">
				<h1 class="text-3xl font-bold text-gray-900 mb-6">Payments</h1>

				{/* Success/Error Messages */}
				<div id="payment-messages">
					<script>
						{`
              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.get('success')) {
                document.write('<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">Payment successful! Your balance has been updated.</div>');
                // Remove query param without refresh
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              if (urlParams.get('canceled')) {
                document.write('<div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">Payment canceled. No charges were made.</div>');
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            `}
					</script>
				</div>

				<div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
					<div class="space-y-6">
						<div class="flex justify-between items-center pb-4 border-b border-slate-200">
							<span class="text-gray-600">Current Balance</span>
							<span class="text-3xl font-bold text-gray-900">
								{formatCurrency(user.walletBalance)}
							</span>
						</div>

						<div>
							<h2 class="text-lg font-semibold text-gray-900 mb-4">
								Top Up Balance
							</h2>

							<div class="bg-blue-50 p-4 rounded-lg mb-6 text-blue-800 text-sm">
								Clicking the button below will redirect you to our secure payment page.
							</div>

							<button
								onclick={`window.open('https://buy.stripe.com/test_aFa7sK8h0cwS3ZH15J5os00?client_reference_id=${user.id}', '_blank')`}
								class="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
							>
								<span>Go to Payment Page</span>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
