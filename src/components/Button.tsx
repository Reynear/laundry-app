type ButtonProps = {
	children: any;
	type?: "button" | "submit" | "reset";
};

export function Button({ children, type = "button" }: ButtonProps) {
	return (
		<button
			type={type}
			class="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700"
		>
			{children}
		</button>
	);
}
