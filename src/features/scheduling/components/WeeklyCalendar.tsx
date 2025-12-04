interface WeeklyCalendarProps {
    shifts: Shift[];
    weekStart: Date;
}

export const WeeklyCalendar = ({ shifts, weekStart }: WeeklyCalendarProps) => {
    // Generate 7 days starting from weekStart
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        return date;
    });

    // Group shifts by day
    const shiftsByDay = days.map(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return {
            date: day,
            shifts: shifts.filter(shift => {
                const shiftDate = new Date(shift.startTime);
                return shiftDate >= dayStart && shiftDate <= dayEnd;
            })
        };
    });

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
                {shiftsByDay.map(({ date, shifts: dayShifts }, index) => (
                    <div key={index} className="bg-white min-h-[200px]">
                        <div className={`p-2 text-center border-b ${isToday(date) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`text-sm font-semibold ${isToday(date) ? 'text-blue-700' : 'text-gray-700'}`}>
                                {formatDate(date)}
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            {dayShifts.length === 0 ? (
                                <div className="text-xs text-gray-400 text-center py-4">No shifts</div>
                            ) : (
                                dayShifts.map(shift => (
                                    <div
                                        key={shift.id}
                                        className={`text-xs p-2 rounded border ${shift.status === 'approved'
                                            ? 'bg-green-50 border-green-200 text-green-800'
                                            : shift.status === 'pending'
                                                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                                : 'bg-gray-50 border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <div className="font-medium truncate">{shift.staffName || 'My Shift'}</div>
                                        <div className="text-xs">
                                            {formatTime(new Date(shift.startTime))} - {formatTime(new Date(shift.endTime))}
                                        </div>
                                        {shift.hallName && (
                                            <div className="text-xs opacity-75 truncate">{shift.hallName}</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
