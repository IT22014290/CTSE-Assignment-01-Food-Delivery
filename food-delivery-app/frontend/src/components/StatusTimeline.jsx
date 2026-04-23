const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

function StatusTimeline({ currentStatus }) {
  const currentIndex = statuses.indexOf(currentStatus);

  return (
    <div className="card">
      <h3 className="mb-4 font-display text-lg">Order Progress</h3>
      <ol className="grid gap-3 md:grid-cols-3">
        {statuses.map((status, index) => {
          const active = index <= currentIndex;
          return (
            <li
              key={status}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {status.replace('_', ' ')}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default StatusTimeline;
