const STEPS = [
  { key: 'pending',   label: 'Pending',    icon: '🕐', desc: 'Order received' },
  { key: 'confirmed', label: 'Confirmed',  icon: '✅', desc: 'Restaurant confirmed' },
  { key: 'preparing', label: 'Preparing',  icon: '👨‍🍳', desc: 'Kitchen is cooking' },
  { key: 'ready',     label: 'Ready',      icon: '📦', desc: 'Packed & ready' },
  { key: 'picked_up', label: 'Picked Up',  icon: '🏍️', desc: 'Driver on the way' },
  { key: 'delivered', label: 'Delivered',  icon: '🎉', desc: 'Enjoy your meal!' },
];

function StatusTimeline({ currentStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);
  const progressPct = currentIndex < 0 ? 0 : Math.round((currentIndex / (STEPS.length - 1)) * 100);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(10,18,40,0.8)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-white">Order Progress</h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
          style={{
            background: currentIndex === STEPS.length - 1 ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)',
            color: currentIndex === STEPS.length - 1 ? '#34d399' : '#fb7185',
            border: `1px solid ${currentIndex === STEPS.length - 1 ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`,
          }}
        >
          {currentStatus?.replace('_', ' ') || 'pending'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #fb7185, #f59e0b, #34d399)',
          }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {STEPS.map((step, index) => {
          const done = index <= currentIndex;
          const active = index === currentIndex;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center gap-2 text-center transition-all duration-300"
            >
              {/* Icon circle */}
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all duration-300"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
                        boxShadow: '0 4px 16px rgba(251,113,133,0.5)',
                        animation: 'pulse-glow 2s ease-in-out infinite',
                      }
                    : done
                    ? {
                        background: 'rgba(52,211,153,0.15)',
                        border: '1px solid rgba(52,211,153,0.3)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        opacity: 0.4,
                      }
                }
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{step.icon}</span>
              </div>

              {/* Label */}
              <p
                className="text-xs font-bold leading-tight"
                style={{ color: active ? '#fb7185' : done ? '#34d399' : '#475569' }}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      {currentIndex >= 0 && (
        <div
          className="mt-5 flex items-center gap-3 rounded-xl p-3"
          style={{ background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.12)' }}
        >
          <span className="text-xl">{STEPS[currentIndex]?.icon}</span>
          <div>
            <p className="text-sm font-semibold text-white">{STEPS[currentIndex]?.label}</p>
            <p className="text-xs text-slate-400">{STEPS[currentIndex]?.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusTimeline;
