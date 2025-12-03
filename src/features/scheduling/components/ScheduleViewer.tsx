import { ShiftListItem } from "./ShiftListItem";
import { WeeklyCalendar } from "./WeeklyCalendar";

interface ScheduleViewerProps {
    shifts: Shift[];
    filter: {
        status?: string;
        hallId?: number;
        date?: string;
    };
    halls: Hall[];
}

export const ScheduleViewer = ({ shifts, filter, halls }: ScheduleViewerProps) => {
    // Calculate week start (Monday of current week)
    const getWeekStart = () => {
        const date = filter.date ? new Date(filter.date) : new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const weekStart = getWeekStart();

    // Sort shifts: pending first (available staff), then by date
    const sortedShifts = [...shifts].sort((a, b) => {
        // Priority order: pending > approved > rejected
        const statusPriority = { pending: 0, approved: 1, rejected: 2, completed: 3, absent: 4 };
        const aPriority = statusPriority[a.status] ?? 5;
        const bPriority = statusPriority[b.status] ?? 5;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        // Within same status, sort by date (newest first)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return (
        <div className="space-y-6">
            <form action="/scheduling/admin" method="get" className="flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold">Shift Requests</h2>

                <div className="flex gap-2">
                    <select
                        name="status"
                        value={filter.status || "pending"}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All Statuses</option>
                    </select>

                    <input
                        type="date"
                        name="date"
                        value={filter.date || ""}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />

                    <select
                        name="hallId"
                        value={filter.hallId || ""}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">All Halls</option>
                        {halls.map(hall => (
                            <option key={hall.id} value={hall.id}>
                                {hall.name}
                            </option>
                        ))}
                    </select>

                    <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">Filter</button>
                </div>
            </form>

            {/* Always show weekly calendar at the top */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold text-gray-700">Weekly Overview</h3>
                    <div className="text-sm text-gray-500">
                        Week of {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(weekStart)}
                    </div>
                </div>
                <WeeklyCalendar shifts={sortedShifts.filter(s => s.status === 'approved')} weekStart={weekStart} />
            </div>

            {/* Show filtered shift list below calendar */}
            <div>
                <h3 className="text-md font-semibold text-gray-700 mb-3">
                    {filter.status === 'approved' ? 'Approved Shifts' :
                        filter.status === 'pending' ? 'Pending Requests' :
                            filter.status === 'rejected' ? 'Rejected Requests' :
                                'All Shifts'}
                </h3>
                <div className="space-y-2">
                    {sortedShifts.map(shift => (
                        <ShiftListItem
                            key={shift.id}
                            shift={shift}
                            isAdmin={true}
                        />
                    ))}
                    {sortedShifts.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No shifts found matching criteria.</p>
                    )}
                </div>
            </div>
        </div>
    );
};