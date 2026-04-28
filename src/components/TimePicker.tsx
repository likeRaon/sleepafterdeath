interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

export default function TimePicker({ value, onChange, className = '' }: TimePickerProps) {
  const parts = (value ?? '00:00').split(':');
  const h = parts[0]?.padStart(2, '0') ?? '00';
  const m = (() => {
    const raw = parts[1] ?? '00';
    // 가장 가까운 10분 단위로 보정
    const n = parseInt(raw, 10);
    const snapped = MINUTES.reduce((prev, cur) =>
      Math.abs(parseInt(cur) - n) < Math.abs(parseInt(prev) - n) ? cur : prev,
    );
    return snapped;
  })();

  const selectBase =
    'bg-[#1a1f35] text-slate-200 rounded-lg border border-[#2a3050] focus:outline-none focus:border-[#4f6ef7] text-sm py-1.5 cursor-pointer';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        className={`${selectBase} pl-2 pr-1 w-[60px]`}
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}시
          </option>
        ))}
      </select>
      <select
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className={`${selectBase} pl-2 pr-1 w-[60px]`}
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}분
          </option>
        ))}
      </select>
    </div>
  );
}
