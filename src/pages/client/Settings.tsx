import { Button } from "../../components/Button";

export function Settings({ user }: { user: User }) {
	return (
		<main class="p-6">
			<div class="max-w-2xl mx-auto">
				<h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

				<div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
					<div class="p-6 border-b border-slate-200">
						<h2 class="text-lg font-bold text-slate-900 mb-1">Notifications</h2>
						<p class="text-sm text-slate-500">
							Manage how you receive alerts and updates.
						</p>
					</div>

					<form class="p-6 space-y-6">
						<div class="flex items-center justify-between">
							<div>
								<label for="email-notifs" class="font-medium text-slate-900">
									Email Notifications
								</label>
								<p class="text-sm text-slate-500">
									Receive booking confirmations and receipts.
								</p>
							</div>
							<input
								type="checkbox"
								id="email-notifs"
								name="email_notifications"
								class="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
								checked
							/>
						</div>

						<div class="flex items-center justify-between">
							<div>
								<label for="push-notifs" class="font-medium text-slate-900">
									Push Notifications
								</label>
								<p class="text-sm text-slate-500">
									Get alerts when your laundry is done.
								</p>
							</div>
							<input
								type="checkbox"
								id="push-notifs"
								name="push_notifications"
								class="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
								checked
							/>
						</div>

						<div class="flex items-center justify-between">
							<div>
								<label for="sms-notifs" class="font-medium text-slate-900">
									SMS Notifications
								</label>
								<p class="text-sm text-slate-500">
									Receive urgent alerts via text message.
								</p>
							</div>
							<input
								type="checkbox"
								id="sms-notifs"
								name="sms_notifications"
								class="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
							/>
						</div>

						<div class="pt-4 flex justify-end">
							<Button type="submit">Save Changes</Button>
						</div>
					</form>
				</div>
			</div>
		</main>
	);
}
