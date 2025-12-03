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
    // Determine current view from URL or default to list
    const currentView = filter.status === "approved" ? "calendar" : "list";

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

                    <select
                        name="hallId"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">All Halls</option>
                        {halls.map(hall => (
                            <option key={hall.id} value={hall.id} selected={filter.hallId === hall.id}>
                                {hall.name}
                            </option>
                        ))}
                    </select>

                    <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">Filter</button>
                </div>
            </form>

            {currentView === "calendar" && filter.status === "approved" ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-semibold text-gray-700">Weekly Overview</h3>
                        <div className="text-sm text-gray-500">
                            Week of {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(weekStart)}
                        </div>
                    </div>
                    <WeeklyCalendar shifts={shifts} weekStart={weekStart} />

                    {/* Show list below calendar for approved shifts */}
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">All Approved Shifts</h3>
                        <div className="space-y-2">
                            {shifts.map(shift => (
                                <ShiftListItem
                                    key={shift.id}
                                    shift={shift}
                                    isAdmin={true}
                                />
                            ))}
                            {shifts.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No approved shifts found.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
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
            )}
        </div>
    );
};