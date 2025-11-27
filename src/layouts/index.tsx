import { BrandLogo } from "../components/BrandLogo";

export function BaseLayout({ children, title }) {
	return (
		<html lang="en">
			<head>
				<title>{title}</title>
				<meta name="description" content="Laundry App" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<link rel="stylesheet" href="/output.css" />
				<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js"></script>
			</head>
			<body>{children}</body>
		</html>
	);
}

export function DashboardLayout({ children, user, currentPath }) {
	return (
		<BaseLayout title="Laundry App">
			<Sidebar user={user} currentPath={currentPath} />

			{/* Main content */}
			<div className="md:ml-64 bg-slate-50 min-h-screen flex flex-col">
				<main className="flex-1">{children}</main>
			</div>
		</BaseLayout>
	);
}

export function Sidebar({ user, currentPath }) {
	const role = user.role;
	return (
		<aside
			id="sidebar"
			className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full md:translate-x-0 bg-slate-50 border-r border-slate-200"
		>
			<div className="h-full px-3 py-4 overflow-y-auto">
				<BrandLogo
					variant="sidebar"
					subtitle={role === "staff" ? "Staff Portal" : "User Portal"}
				/>

				<div className="mb-6 px-3 pb-4 border-b border-slate-200">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-linear-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
							<span className="text-white font-semibold text-lg">SA</span>
						</div>
						<div>
							<p className="font-semibold text-gray-900 text-base">
								{user.firstName} {user.lastName}
							</p>
							{user.hallName && (
								<p className="text-sm text-slate-500">{user.hallName}</p>
							)}
						</div>
					</div>
				</div>

				<ul className="space-y-1">
					{[
						{
							href: "/dashboard",
							label: "Dashboard",
							icon: (
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Dashboard icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
									/>
								</svg>
							),
						},
						{
							href:
								user.role === "student"
									? "/appointments/book"
									: "/appointments",
							label:
								user.role === "student" ? "Book Appointment" : "Appointments",
							icon: (
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Appointments icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							),
						},
						{
							href: user.role === "student" ? "/payments" : "/scheduling",
							label: user.role === "student" ? "Payments" : "Scheduling",
							icon:
								user.role === "student" ? (
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Payments icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
										/>
									</svg>
								) : (
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Scheduling icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								),
						},
						{
							href: "/timers",
							label: "Machine Timers",
							icon: (
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Machine Timers icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							),
						},
						{
							href: "/notices",
							label: "Notices",
							icon: (
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Notices icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
									/>
								</svg>
							),
						},
						{
							href: "/settings",
							label: "Settings",
							icon: (
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Settings icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							),
						},
					]
						.filter(
							(item) =>
								!(item.label === "Machine Timers" && user.role === "student"),
						)
						.map((item) => {
							const isActive = currentPath
								? item.href === "/appointments"
									? currentPath.startsWith("/appointments")
									: item.href === currentPath
								: item.href === "/dashboard";

							return (
								<li>
									<a
										href={item.href}
										className={
											isActive
												? "flex items-center gap-3 px-3 py-3 text-base font-medium text-white bg-slate-600 rounded-lg"
												: "flex items-center gap-3 px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
										}
									>
										{item.icon}
										{item.label}
									</a>
								</li>
							);
						})}

					<li className="pt-4 border-t border-slate-200">
						<form method="post" action="/api/logout">
							<button
								type="submit"
								className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Logout icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Logout
							</button>
						</form>
					</li>
				</ul>
			</div>
		</aside>
	);
}
