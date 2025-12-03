import { DashboardLayout } from "../../layouts";
import { RosterManager } from "../../features/scheduling/components/RosterManager";

// This page is no longer used since routes.tsx handles rendering directly
// Keeping for reference but can be deleted
export const Scheduling = () => {
    return (
        <DashboardLayout user={{} as User} currentPath="/scheduling">
            <div className="max-w-4xl mx-auto">
                <RosterManager shifts={[]} />
            </div>
        </DashboardLayout>
    );
};