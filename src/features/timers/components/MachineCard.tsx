export default function MachineCard({ machine }) {
  const isRunning = !!machine.session;

  return (
    <div class={`border p-4 rounded-lg shadow-sm
        ${machine.hasActiveAppointment ? "border-yellow-500" : "border-gray-300"}
    `}>
      <h2 class="font-semibold text-lg mb-2">{machine.name}</h2>

      {isRunning ? (
        <div>
          <p class="text-blue-600">Running</p>
          <p class="text-sm">
            Ends at: {new Date(machine.session.expectedEndTime).toLocaleTimeString()}
          </p>

          <form
            hx-post={`/timers/${machine.session.id}/stop`}
            hx-target="#machine-list"
            hx-swap="outerHTML"
          >
            <button class="mt-2 px-3 py-1 bg-red-600 text-white rounded">
              Stop
            </button>
          </form>
        </div>
      ) : (
        <div>
          {machine.hasActiveAppointment && (
            <p class="text-yellow-600 text-sm mb-2">
              Appointment: {machine.appointmentDetails.userName}
            </p>
          )}

          <button
            hx-get={`/timers/${machine.id}/duration`}
            hx-target="#modal"
            class="px-3 py-1 bg-green-600 text-white rounded"
          >
            Start Timer
          </button>
        </div>
      )}
    </div>
  );
}
