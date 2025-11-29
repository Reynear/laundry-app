type AlertProps = {
	type: "error" | "success" | "info" | "warning";
	title: string;
	description: string;
};

const styles: Record<AlertProps["type"], string> = {
	error: "alert-destructive",
	success: "alert",
	info: "alert",
	warning: "alert",
};

export function Alert({ type, title, description }: AlertProps) {
	const cls = styles[type];
	return (
		<div id="alert-slot" class="alert-collapsible">
			<div
				class={`rounded-md border text-sm p-3 flex items-start gap-2 ${cls}`}
				role="alert"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					role="img"
					aria-label="Alert icon"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" x2="12" y1="8" y2="12" />
					<line x1="12" x2="12.01" y1="16" y2="16" />
				</svg>
				<div class="flex flex-col">
					<strong class="font-medium">{title}</strong>
					<span class="block">{description}</span>
				</div>
			</div>
			<div
				hx-get="/api/login/clear-alert"
				hx-trigger="load delay:4s"
				hx-target="#alert-slot"
				hx-swap="outerHTML swap:500ms"
				class="hidden"
			/>
		</div>
	);
}
