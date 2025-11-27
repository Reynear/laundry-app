type BrandLogoProps = {
	variant?: "auth" | "sidebar";
	subtitle?: string;
};

export function BrandLogo({ variant = "auth", subtitle }: BrandLogoProps) {
	const isAuth = variant === "auth";
	const wrapperClass = isAuth
		? "text-center space-y-1"
		: "flex items-center gap-3 mb-8 px-3 pt-2";
	const logoBoxClass = isAuth
		? "w-14 h-14 mx-auto mb-2 bg-black rounded-lg flex items-center justify-center"
		: "w-12 h-12 bg-linear-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center";
	const titleClass = isAuth
		? "text-3xl font-bold text-gray-900"
		: "text-2xl font-bold text-gray-900 tracking-tight";
	const subtitleClass = isAuth
		? "block text-base text-gray-600"
		: "block text-sm text-slate-600 font-semibold";
	return (
		<div class={wrapperClass}>
			<div class={logoBoxClass}>
				<span class="text-white font-bold text-3xl">C</span>
			</div>
			<div>
				<span class={titleClass}>CleanPay</span>
				{subtitle && <span class={subtitleClass}>{subtitle}</span>}
			</div>
		</div>
	);
}
