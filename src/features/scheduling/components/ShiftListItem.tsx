interface ShiftListItemProps {
    shift: Shift;
    isAdmin?: boolean;
}

export const ShiftListItem = ({ shift, isAdmin }: ShiftListItemProps) => {
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        completed: "bg-gray-100 text-gray-800",
        absent: "bg-red-200 text-red-900",
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
    };

    const start = new Date(shift.startTime);
    const end = new Date(shift.endTime);

    return (
        <div id={`shift-${shift.id}`} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm mb-2">
            <div>
                <div className="font-medium">
                    {formatDate(start)}
                </div>
                <div className="text-sm text-gray-600">
                    {formatTime(start)} - {formatTime(end)}
                </div>
                {isAdmin && shift.staffName && (
                    <div className="text-sm text-blue-600 font-medium">
                        {shift.staffName}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[shift.status]}`}>
                    {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                </span>

                {isAdmin && shift.status === "pending" && (
                    <div className="flex gap-1">
                        <button
                            hx-patch={`/scheduling/${shift.id}/approve`}
                            hx-target={`#shift-${shift.id}`}
                            hx-swap="outerHTML"
                            className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
                            title="Approve"
                        >
                            ✓
                        </button>
                        <button
                            hx-patch={`/scheduling/${shift.id}/reject`}
                            hx-target={`#shift-${shift.id}`}
                            hx-swap="outerHTML"
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Reject"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {isAdmin && (
                    <button
                        hx-delete={`/scheduling/${shift.id}`}
                        hx-target={`#shift-${shift.id}`}
                        hx-swap="outerHTML"
                        hx-confirm="Are you sure you want to delete this shift?"
                        className="text-sm text-red-600 hover:underline cursor-pointer ml-2"
                        title="Delete shift"
                    >
                        Delete
                    </button>
                )}

                {!isAdmin && shift.status === "pending" && (
                    <button
                        hx-delete={`/scheduling/${shift.id}`}
                        hx-target={`#shift-${shift.id}`}
                        hx-swap="outerHTML"
                        hx-confirm="Are you sure you want to cancel this shift request?"
                        className="text-sm text-red-600 hover:underline cursor-pointer"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};
