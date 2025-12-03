import { format } from "date-fns";

interface ShiftListItemProps {
    shift: Shift;
    isAdmin?: boolean;
    onCancel?: (id: number) => void;
    onApprove?: (id: number) => void;
    onReject?: (id: number) => void;
}

export const ShiftListItem = ({ shift, isAdmin, onCancel, onApprove, onReject }: ShiftListItemProps) => {
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        completed: "bg-gray-100 text-gray-800",
        absent: "bg-red-200 text-red-900",
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm mb-2">
            <div>
                <div className="font-medium">
                    {format(new Date(shift.startTime), "MMM d, yyyy")}
                </div>
                <div className="text-sm text-gray-600">
                    {format(new Date(shift.startTime), "h:mm a")} - {format(new Date(shift.endTime), "h:mm a")}
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
                            onClick={() => onApprove?.(shift.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                        >
                            ✓
                        </button>
                        <button
                            onClick={() => onReject?.(shift.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {!isAdmin && shift.status === "pending" && (
                    <button
                        onClick={() => onCancel?.(shift.id)}
                        className="text-sm text-red-600 hover:underline"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};
