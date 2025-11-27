type SelectOption = [string, string];

type SelectProps = {
	id: string;
	label: string;
	options: SelectOption[];
};

export function Select({ id, label, options }: SelectProps) {
	return (
		<label class="block text-base font-medium text-gray-700 space-y-2">
			<span>{label}</span>
			<select
				id={id}
				name={id}
				required
				class="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
			>
				{options.map(([value, text]) => (
					<option value={value}>{text}</option>
				))}
			</select>
		</label>
	);
}
