export default function TimerDurationInput({ machineId }) {
  return (
    <div class="p-4">
      <h3 class="text-xl font-bold mb-3">Set Duration</h3>

      <form
        hx-post={`/timers/${machineId}/start`}
        hx-target="#machine-list"
        hx-swap="outerHTML"
      >
        <div class="space-x-2 mb-3">
          {[30, 45, 60].map(min => (
            <button
              type="submit"
              name="duration"
              value={min}
              class="px-3 py-1 bg-blue-600 text-white rounded"
            >
              {min} min
            </button>
          ))}
        </div>

        <input
          type="number"
          name="duration"
          placeholder="Custom minutes"
          class="border p-2 rounded w-full mb-3"
        />

        <button class="w-full bg-green-700 text-white py-2 rounded">
          Start
        </button>
      </form>
    </div>
  );
}
