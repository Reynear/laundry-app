import { DashboardLayout } from "../../layouts";
import { RosterManager } from "../../features/scheduling/components/RosterManager";


export const Scheduling = () => {
    return (
        <DashboardLayout user={{} as User} currentPath="/scheduling">
            <div className="max-w-4xl mx-auto">
                <RosterManager shifts={[]} />
            </div>
        </DashboardLayout>
    );
};