interface MachineCardProps {
    machine: {
        id: number;
        type: "washer" | "dryer";
        status: "available" | "in_use" | "out_of_service" | "maintenance";
        durationMins: number;
        session?: {
            id: number;
            startTime: string | Date;
            expectedEndTime: string | Date;
            sessionStatus: string;
            isUsersMachine: boolean;
            hallName?: string;
            startedByUserId: number;
        } | null;
    };
}

export function MachineCard({ machine }: MachineCardProps) {
    // Debug logging
    const hasSession = !!machine.session;
    const sessionStatus = machine.session?.sessionStatus;
    const machineStatus = machine.status;

    // Show Stop button if session exists and is running
    // Note: Currently checking isUsersMachine inside the render to prevent accidental stops of others' machines
    // If staff should stop ANY machine, we need to pass that permission or update isUsersMachine logic
    const showStopButton = hasSession && sessionStatus !== "completed";

    // Show Start button if:
    // 1. No session exists OR session is completed
    // AND
    // 2. Machine is physically available (not out of service or maintenance)
    const showStartButton = (!hasSession || sessionStatus === "completed") && machineStatus === "available";

    console.log(`Machine ${machine.id}:`, {
        hasSession,
        sessionStatus,
        machineStatus,
        showStopButton,
        showStartButton,
        isUsersMachine: machine.session?.isUsersMachine
    });

    const getStatusColor = () => {
        switch (machine.status) {
            case "available":
                return "bg-emerald-50 border-emerald-200";
            case "in_use":
                return "bg-blue-50 border-blue-200";
            case "out_of_service":
                return "bg-red-50 border-red-200";
            case "maintenance":
                return "bg-yellow-50 border-yellow-200";
            default:
                return "bg-slate-50 border-slate-200";
        }
    };

    const getStatusBadge = () => {
        switch (machine.status) {
            case "available":
                return (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <svg
                            class="w-2 h-2 mr-1"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Available
                    </span>
                );
            case "in_use":
                return (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg
                            class="w-2 h-2 mr-1 animate-pulse"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        In Use
                    </span>
                );
            case "out_of_service":
                return (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <svg
                            class="w-2 h-2 mr-1"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Out of Service
                    </span>
                );
            case "maintenance":
                return (
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg
                            class="w-2 h-2 mr-1"
                            fill="currentColor"
                            viewBox="0 0 8 8"
                        >
                            <circle cx="4" cy="4" r="3" />
                        </svg>
                        Maintenance
                    </span>
                );
        }
    };

    const getMachineIcon = () => {
        if (machine.type === "washer") {
            return (
                <svg
                    class="w-8 h-8 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 7h16M4 7a2 2 0 012-2h12a2 2 0 012 2M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M9 12a3 3 0 106 0 3 3 0 00-6 0z"
                    />
                </svg>
            );
        } else {
            return (
                <svg
                    class="w-8 h-8 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            );
        }
    };

    const formatTimeRemaining = () => {
        if (!machine.session) return null;

        const endTime = machine.session.expectedEndTime instanceof Date
            ? machine.session.expectedEndTime.getTime()
            : new Date(machine.session.expectedEndTime).getTime();
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        if (!machine.session) return 0;
        const start = machine.session.startTime instanceof Date
            ? machine.session.startTime.getTime()
            : new Date(machine.session.startTime).getTime();
        const end = machine.session.expectedEndTime instanceof Date
            ? machine.session.expectedEndTime.getTime()
            : new Date(machine.session.expectedEndTime).getTime();
        const now = Date.now();
        return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    };

    return (
        <div class={`machine-card-enter rounded-xl border-2 ${getStatusColor()} p-6 transition-all hover:shadow-xl hover:scale-[1.02] duration-300`}>
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="p-2 bg-white rounded-lg shadow-sm">
                        {getMachineIcon()}
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 capitalize">
                            {machine.type} #{machine.id}
                        </h3>
                        <p class="text-sm text-slate-500">
                            {machine.durationMins} min cycle
                        </p>
                    </div>
                </div>
                {getStatusBadge()}
            </div>

            {/* Timer and Stop button */}
            {/* Timer and Stop button */}
            {showStopButton && machine.session && (
                <div class="mt-4 pt-4 border-t border-slate-200">

                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-slate-700">Time Remaining</span>
                        <span class="text-2xl font-bold text-blue-600 tabular-nums timer-pulse">
                            {formatTimeRemaining()}
                        </span>
                    </div>

                    <div class="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
                        <div
                            class="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-2.5 rounded-full transition-all duration-1000 progress-shimmer"
                            style={`width: ${getProgress()}%`}
                        />
                    </div>

                    {/* Show stop button for all staff users */}
                    <button
                        class="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                        hx-post={`/timers/${machine.session.id}/stop`}
                        hx-target="#machine-list"
                        hx-swap="innerHTML"
                    >
                        Stop Machine
                    </button>
                </div>
            )}

            {/* Start button */}
            {showStartButton && (
                <div class="mt-4 pt-4 border-t border-slate-200">
                    <button
                        class="w-full px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                        hx-post={`/timers/${machine.id}/start`}
                        hx-vals={`{"duration": ${machine.durationMins}}`}
                        hx-target="#machine-list"
                        hx-swap="innerHTML"
                    >
                        Start Machine
                    </button>
                </div>
            )}

            {machine.status === "out_of_service" && (
                <div class="mt-4 pt-4 border-t border-slate-200">
                    <p class="text-sm text-red-600 font-medium">
                        ⚠️ This machine is currently out of service
                    </p>
                </div>
            )}

            {machine.status === "maintenance" && (
                <div class="mt-4 pt-4 border-t border-slate-200">
                    <p class="text-sm text-yellow-600 font-medium">
                        🔧 This machine is under maintenance
                    </p>
                </div>
            )}
        </div>
    );
}
