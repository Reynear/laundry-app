import { ShiftListItem } from "./ShiftListItem";

interface ScheduleViewerProps {
    shifts: Shift[];
    filter: {
        status?: string;
        hallId?: number;
        date?: string;
    };
}

export const ScheduleViewer = ({ shifts, filter }: ScheduleViewerProps) => {
    return (
        <div className="space-y-6">
            <form action="/scheduling/admin" method="get" className="flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold">Shift Requests</h2>

                <div className="flex gap-2">
                    <select
                        name="status"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="pending" selected={filter.status === "pending"}>Pending</option>
                        <option value="approved" selected={filter.status === "approved"}>Approved</option>
                        <option value="rejected" selected={filter.status === "rejected"}>Rejected</option>
                        <option value="all" selected={filter.status === "all"}>All Statuses</option>
                    </select>

                    <input
                        type="date"
                        name="date"
                        value={filter.date || ""}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        name="hallId"
                        placeholder="Hall ID"
                        value={filter.hallId || ""}
                        className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />

                    <button type="submit" className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 text-sm">Filter</button>
                </div>
            </form>

            <div className="space-y-2">
                {shifts.map(shift => (
                    <ShiftListItem
                        key={shift.id}
                        shift={shift}
                        isAdmin={true}
                    />
                ))}
                {shifts.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No shifts found matching criteria.</p>
                )}
            </div>
        </div>
    );
};