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
        <div className="text-sm text-gray-500">
            Week of {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(weekStart)}
        </div>
                    </div >
    <WeeklyCalendar shifts={shifts} weekStart={weekStart} />

{/* Show list below calendar for approved shifts */ }
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
                </div >
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
        </div >
    );
};