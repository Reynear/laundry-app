import { NotificationSettings } from "../../features/notifications/NotificationSettings";

export function Settings() {
	return (
		<main class="p-6">
			<div class="max-w-2xl mx-auto">
				<h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

				<NotificationSettings />
			</div>
		</main>
	);
}
