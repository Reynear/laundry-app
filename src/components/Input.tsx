type InputProps = {
	id: string;
	type: string;
	label: string;
	placeholder?: string;
	value?: string;
};

export function Input({
	id,
	type,
	label,
	placeholder,
	value = "",
}: InputProps) {
	return (
		<label class="block text-base text-gray-700 font-medium space-y-2">
			<span>{label}</span>
			<input
				id={id}
				name={id}
				type={type}
				placeholder={placeholder}
				required
				value={value}
				class="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
			/>
		</label>
	);
}
