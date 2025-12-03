import { useState, useEffect } from "react";
import { ShiftListItem } from "./ShiftListItem";

export const ScheduleViewer = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: "pending",
        hallId: "",
        date: ""
    });

    useEffect(() => {
        fetchShifts();
    }, [filter]);

    const fetchShifts = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.status && filter.status !== "all") params.append("status", filter.status);
        if (filter.hallId) params.append("hallId", filter.hallId);
        if (filter.date) params.append("date", filter.date);

        const res = await fetch(`/scheduling/admin?${params.toString()}`);
        if (res.ok) {
            const data = await res.json();
            setShifts(data);
        }
        setLoading(false);
    };

    const handleApprove = async (id: number) => {
        const res = await fetch(`/scheduling/${id}/approve`, { method: "PATCH" });
        if (res.ok) fetchShifts();
    };

    const handleReject = async (id: number) => {
        const res = await fetch(`/scheduling/${id}/reject`, { method: "PATCH" });
        if (res.ok) fetchShifts();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold">Shift Requests</h2>

                <div className="flex gap-2">
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All Statuses</option>
                    </select>

                    <input
                        type="date"
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        placeholder="Hall ID"
                        value={filter.hallId}
                        onChange={(e) => setFilter({ ...filter, hallId: e.target.value })}
                        className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="space-y-2">
                    {shifts.map(shift => (
                        <ShiftListItem
                            key={shift.id}
                            shift={shift}
                            isAdmin={true}
                            onApprove={handleApprove}
                            onReject={handleReject}
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