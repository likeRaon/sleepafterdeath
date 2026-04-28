import { addDays, subDays, isSameDay } from 'date-fns';
import { getWeekStart, getWeekEnd, formatDateKo } from '../utils/dateUtils';

interface WeekNavProps {
  weekStart: Date;
  onChangeWeek: (newWeekStart: Date) => void;
}

export default function WeekNav({ weekStart, onChangeWeek }: WeekNavProps) {
  const weekEnd = getWeekEnd(weekStart);
  const thisWeekStart = getWeekStart(new Date());
  const isThisWeek = isSameDay(weekStart, thisWeekStart);

  const goPrev = () => onChangeWeek(getWeekStart(subDays(weekStart, 1)));
  const goNext = () => onChangeWeek(getWeekStart(addDays(weekStart, 7)));
  const goThis = () => onChangeWeek(thisWeekStart);

  const arrowBtn = 'flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all group';

  return (
    <div className="card mb-5">
      <div className="relative flex items-center py-3">
        <button onClick={goPrev} className={`${arrowBtn} ml-2 flex-shrink-0`}>
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2.5">
            {isThisWeek && <span className="badge badge-blue">이번 주</span>}
            <span className="text-white font-bold text-sm sm:text-base">
              {formatDateKo(weekStart)}
              <span className="text-slate-500 mx-1.5 font-normal">—</span>
              {formatDateKo(weekEnd)}
            </span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: '#3a5278' }}>매주 수요일 초기화</p>
        </div>

        <div className="flex items-center gap-1 mr-2 flex-shrink-0">
          {!isThisWeek && (
            <button
              onClick={goThis}
              className="hidden sm:block text-xs text-[#4f8ef7] hover:text-[#6aa3ff] transition-colors px-2 py-1 font-semibold rounded-lg hover:bg-[#4f8ef7]/10"
            >
              이번 주
            </button>
          )}
          <button onClick={goNext} className={arrowBtn}>
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
