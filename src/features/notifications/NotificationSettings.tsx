export function NotificationSettings() {
	return (
		<div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-6">
			<div class="p-6 border-b border-slate-200">
				<h2 class="text-lg font-bold text-slate-900 mb-1">
					Desktop Notifications
				</h2>
				<p class="text-sm text-slate-500">
					Receive browser alerts for upcoming appointments.
				</p>
			</div>

			<div class="p-6 space-y-6">
				<div class="flex items-center justify-between">
					<div>
						<label for="desktop-notifs" class="font-medium text-slate-900">
							Enable Notifications
						</label>
						<p class="text-sm text-slate-500">
							Allow browser notifications for this app.
						</p>
					</div>
					<input
						type="checkbox"
						id="desktop-notifs"
						class="w-5 h-5 text-slate-600 rounded focus:ring-slate-500 border-gray-300"
						onchange="window.NotificationHandler && window.NotificationHandler.updateSettings({ enabled: this.checked })"
					/>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<label for="reminder-time" class="font-medium text-slate-900">
							Appointment Reminder
						</label>
						<p class="text-sm text-slate-500">
							How early to remind you before appointments.
						</p>
					</div>
					<select
						id="reminder-time"
						class="rounded border-gray-300 text-sm"
						onchange="window.NotificationHandler && window.NotificationHandler.updateSettings({ appointmentReminderMins: parseInt(this.value) })"
					>
						<option value="5">5 minutes</option>
						<option value="15">15 minutes</option>
						<option value="30">30 minutes</option>
						<option value="60">1 hour</option>
					</select>
				</div>

				<div class="pt-4">
					<button
						type="button"
						class="text-sm text-slate-600 hover:text-slate-900 underline"
						onclick="window.NotificationHandler && window.NotificationHandler.requestPermission().then(function(granted) { alert(granted ? 'Notifications enabled!' : 'Permission denied'); })"
					>
						Request notification permission
					</button>
				</div>
			</div>

			{/* Script to sync UI with localStorage settings on page load */}
			<script
				dangerouslySetInnerHTML={{
					__html: `
					(function() {
						function syncSettingsUI() {
							if (!window.NotificationHandler) {
								setTimeout(syncSettingsUI, 100);
								return;
							}
							var settings = window.NotificationHandler.getSettings();
							var enabledCheckbox = document.getElementById('desktop-notifs');
							var reminderSelect = document.getElementById('reminder-time');
							if (enabledCheckbox) enabledCheckbox.checked = settings.enabled;
							if (reminderSelect) reminderSelect.value = String(settings.appointmentReminderMins);
						}
						if (document.readyState === 'loading') {
							document.addEventListener('DOMContentLoaded', syncSettingsUI);
						} else {
							syncSettingsUI();
						}
					})();
				`,
				}}
			/>
		</div>
	);
}
