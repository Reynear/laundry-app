export default function MachineTimers({ hall }) {
  return (
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-4">
        Machine Timers — {hall.name}
      </h1>

      <div
        id="machine-list"
        hx-get="/timers/machines"
        hx-trigger="load, every 15s"
        hx-swap="innerHTML"
      >
        Loading machines…
      </div>
    </div>
  );
}
