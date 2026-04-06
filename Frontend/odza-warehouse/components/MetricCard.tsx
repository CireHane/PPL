type Props = {
  label: string;
  value: string;
  unit: string;
  type: "sparkline" | "progress";
  progress?: number;
};

export default function MetricCard({ label, value, unit, type, progress }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-4">
      <p className="text-[11px] text-gray-400 mb-1.5">{label}</p>
      <p className="text-xl font-medium text-gray-900 mb-3">
        {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
      </p>
      {type === "sparkline" && (
        <svg viewBox="0 0 200 36" className="w-full h-8" preserveAspectRatio="none">
          <polyline points="0,28 28,24 56,26 84,18 112,22 140,20 168,16 200,18"
            fill="none" stroke="#d1d5db" strokeWidth="1.5" />
          <circle cx="200" cy="18" r="3" fill="#111827" />
        </svg>
      )}
      {type === "progress" && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gray-800 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}