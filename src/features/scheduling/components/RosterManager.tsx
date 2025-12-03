import { useState, useEffect } from "react";
import { ShiftListItem } from "./ShiftListItem";

export const RosterManager = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [newShift, setNewShift] = useState({
        date: "",
        startTime: "",
        endTime: ""
    });

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        const res = await fetch("/scheduling");
        if (res.ok) {
            const data = await res.json();
            setShifts(data);
        }
        setLoading(false);
    };

    const handleCreateShift = async (e: React.FormEvent) => {
        e.preventDefault();
        const start = new Date(`${newShift.date}T${newShift.startTime}`);
        const end = new Date(`${newShift.date}T${newShift.endTime}`);

        const res = await fetch("/scheduling", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startTime: start, endTime: end })
        });

        if (res.ok) {
            fetchShifts();
            setNewShift({ date: "", startTime: "", endTime: "" });
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this shift request?")) return;

        const res = await fetch(`/scheduling/${id}`, { method: "DELETE" });
        if (res.ok) fetchShifts();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Request New Shift</h2>
                <form onSubmit={handleCreateShift} className="flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={newShift.date}
                            onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={newShift.startTime}
                            onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={newShift.endTime}
                            onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Request Shift
                    </button>
                </form>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-4">My Shifts</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="space-y-2">
                        {shifts.map(shift => (
                            <ShiftListItem
                                key={shift.id}
                                shift={shift}
                                onCancel={handleCancel}
                            />
                        ))}
                        {shifts.length === 0 && (
                            <p className="text-gray-500">No shifts found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
