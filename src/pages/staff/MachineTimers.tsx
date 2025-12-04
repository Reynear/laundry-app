import { DashboardLayout } from "../../layouts";

export default function MachineTimers({ user, hall, allHalls }) {
  const isAdmin = user.role === "admin" || user.role === "manager";

  return (
    <DashboardLayout user={user} currentPath="/timers">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">
              Machine Timers — {hall.name}
            </h1>
            <p class="text-sm text-slate-500 mt-1">
              Monitor and control laundry machines
            </p>
          </div>
          <div class="flex items-center gap-3">
            {/* Hall Selector for Admins */}
            {isAdmin && allHalls && allHalls.length > 0 && (
              <select
                class="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                onchange="window.location.href='/timers?hallId=' + this.value"
              >
                {allHalls.map((h) => (
                  <option value={h.id} selected={h.id === hall.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              hx-get={`/timers/machines?hallId=${hall.id}`}
              hx-target="#machine-list"
              hx-swap="innerHTML"
            >
              Refresh
            </button>
          </div>
        </div>

        <div
          id="machine-list"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          hx-get={`/timers/machines?hallId=${hall.id}`}
          hx-trigger="load, every 15s"
          hx-swap="innerHTML"
        >
          <div class="col-span-full flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
