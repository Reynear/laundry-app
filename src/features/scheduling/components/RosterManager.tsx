import { ShiftListItem } from "./ShiftListItem";

interface RosterManagerProps {
    shifts: Shift[];
}

export const RosterManager = ({ shifts }: RosterManagerProps) => {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Request New Shift</h2>
                <form hx-post="/scheduling" hx-target="#shifts-list" hx-swap="afterbegin" className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            name="startTime"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            name="endTime"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
                    >
                        Request Shift
                    </button>
                </form>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4">My Shifts</h2>
                <div id="shifts-list" className="space-y-2">
                    {shifts.map(shift => (
                        <ShiftListItem
                            key={shift.id}
                            shift={shift}
                        />
                    ))}
                    {shifts.length === 0 && (
                        <p className="text-gray-500">No shifts found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
