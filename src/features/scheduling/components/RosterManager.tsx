import { ShiftListItem } from "./ShiftListItem";
import { WeeklyCalendar } from "./WeeklyCalendar";

interface RosterManagerProps {
    shifts: Shift[];
}

export const RosterManager = ({ shifts }: RosterManagerProps) => {
    //Getting the start of the week 
    const getWeekStart = () => {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    //To use for the weekly calendar
    const weekStart = getWeekStart();
    const approvedShifts = shifts.filter(s => s.status === 'approved');
    //Layout information
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Add A New Shift</h2>
                <form
                    hx-post="/scheduling"
                    hx-target="#shifts-list"
                    hx-swap="afterbegin"
                    className="flex gap-4 items-end"
                    onsubmit="
                        const startTime = this.querySelector('[name=startTime]').value;
                        const endTime = this.querySelector('[name=endTime]').value;
                        if (endTime <= startTime) {
                            alert('End time has t0 be after start time');
                            return false;
                        }
                        return true;
                    "
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            name="startTime"
                            required
                            min="08:00"
                            max="22:00"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            name="endTime"
                            required
                            //Putting in restrictions for the operating times
                            min="08:00"
                            max="22:00"
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

            {/*Generating the weekly calendar to show the approved shifts*/}
            {approvedShifts.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">My Schedule</h2>
                        <div className="text-sm text-gray-500">
                            Week of {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(weekStart)}
                        </div>
                    </div>
                    <WeeklyCalendar shifts={approvedShifts} weekstart={weekStart} />
                </div>
            )}

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
                        <p className="text-gray-500">No Shifts, Free Slots</p>
                    )}
                </div>
            </div>
        </div>
    );
};
