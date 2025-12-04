import { ShiftListItem } from "./ShiftListItem";
import { WeeklyCalendar } from "./WeeklyCalendar";

interface ScheduleViewerProps {
    shifts: Shift[];
    filter: {
        status?: string; hallId?: number; date?: string;
    };
    halls: Hall[];
    isManager?: boolean;
}
export const ScheduleViewer = ({ shifts, filter, halls, isManager = false }: ScheduleViewerProps) => {
    const currentView = filter.status ==="approved" ?"calendar":"list";
    const formAction = isManager ? "/scheduling/manager" : "/scheduling/admin";

    // In order to show the weekly schedule with the approved shifts
    const getWeekStart = () => {
        const date = filter.date ? new Date(filter.date) : new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const weekStart = getWeekStart();

    //Sorting shifts
    const sortedshifts = [...shifts].sort((a, b) => {
        const statusPriority = { pending: 0, approved: 1, rejected: 2, completed: 3};
        const aPriority = statusPriority[a.status] ?? 5;
        const bPriority = statusPriority[b.status] ?? 5;
        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }
        return new Date(b.startTime).getTime()-new Date(a.startTime).getTime();
    });
    
    //Layout and information for the Admin/Manager Scheduling page
    return (
        <div className="space-y-6">
            <form action={formAction} method="get" className="flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold">
                    {isManager ? `Shift Requests - ${halls[0]?.name || "Your Hall"}` : "Shift Requests"}
                </h2>

                <div className="flex gap-2">
                    <select
                        name="status"
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="pending" selected={!filter.status || filter.status === "pending"}>Pending</option>
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
                    {!isManager && (
                        <select
                            name="hallId"
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="" selected={!filter.hallId}>All Halls</option>
                            {halls.map(hall => (
                                <option key={hall.id} value={hall.id} selected={filter.hallId === hall.id}>
                                    {hall.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">Filter</button>
                </div>
            </form>

            {currentView ==="calendar"&&filter.status==="approved"?(
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-md font-semibold text-gray-700">Weekly Schedule</h3>
                        <div className="text-sm text-gray-500">
                            Week of {new Intl.DateTimeFormat('en-US',{ month:'long', day:'numeric', year:'numeric' }).format(weekStart)}
                        </div>
                    </div>
                    <WeeklyCalendar shifts={sortedshifts} weekstart={weekStart} />



                    {/*Shows the shifts that have been approved by the admin*/}
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">All Shifts</h3>
                        <div className="space-y-2">
                            {sortedshifts.map(shift => (
                                <ShiftListItem
                                    key={shift.id} shift={shift}
                                    isAdmin={true}
                                />
                            ))}
                            {sortedshifts.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No approved shifts are found.</p>
                            )}
                        </div>
                    </div>
                </div>
            ):(
                <div className="space-y-2">
                    {sortedshifts.map(shift => (
                        <ShiftListItem
                            key={shift.id} shift={shift}
                            isAdmin={true}
                        />
                    ))}
                    {sortedshifts.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No shifts are found.</p>
                    )}
                </div>
            )}
        </div>
    );
};