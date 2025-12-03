import { DashboardLayout } from "../../layouts";
import { RosterManager } from "../../features/scheduling/components/RosterManager";
import { ScheduleViewer } from "../../features/scheduling/components/ScheduleViewer";
import { useAuth } from "../../features/auth/hooks/useAuth"; // Assuming this exists or similar

export const Scheduling = () => {
    // We can get user role from context or a hook
    // For now, let's assume we have access to the user object
    // You might need to adjust this based on your actual auth implementation
    const user = { role: "staff" }; // Placeholder

    return (
        <DashboardLayout title="Scheduling">
            <div className="max-w-4xl mx-auto">
                <RosterManager />
                {/* 
                    If user is admin, show ScheduleViewer instead or below
                    {user.role === 'admin' ? <ScheduleViewer /> : <RosterManager />}
                */}
            </div>
        </DashboardLayout>
    );
};