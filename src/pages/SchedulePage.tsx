import type { AppConfig, WeeklySchedule } from '../types';
import { getWeekDays, formatDateKo, formatDate, isWeekend } from '../utils/dateUtils';
import WeekNav from '../components/WeekNav';

interface SchedulePageProps {
  config: AppConfig;
  weekStart: Date;
  onChangeWeek: (d: Date) => void;
  schedule: WeeklySchedule | null;
}

const MEMBER_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#e879f9',
];

export default function SchedulePage({ config, weekStart, onChangeWeek, schedule }: SchedulePageProps) {
  const days = getWeekDays(weekStart);
  const total = config.members.length;

  const submittedMembers = config.members.filter((m) => schedule?.memberSchedules?.[m.id] !== undefined);
  const notSubmitted = config.members.filter((m) => schedule?.memberSchedules?.[m.id] === undefined);
  const submitRatio = total > 0 ? (submittedMembers.length / total) * 100 : 0;
  const allSubmitted = submittedMembers.length === total && total > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <WeekNav weekStart={weekStart} onChangeWeek={onChangeWeek} />

      {(schedule?.confirmedTimes?.length ?? 0) > 0 && (
        <div className="card mb-5 glow-gold">
          <div className="px-5 py-3.5 border-b border-[#1e2d4a]">
            <h2 className="text-gradient-gold font-bold text-sm">⚔️ 확정된 레이드 일정</h2>
          </div>
          <div className="p-4 space-y-2">
            {schedule!.confirmedTimes.map((ct, idx) => {
              const raid = config.raids.find((r) => r.id === ct.raidId);
              return (
                <div key={idx} className="card-inner flex items-center gap-4 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#c9a227]/15 border border-[#c9a227]/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⚔️</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{raid?.name ?? '레이드'}</p>
                    <p className="text-[#c9a227] text-xs mt-0.5">
                      {formatDateKo(new Date(ct.date))} · {ct.startTime} 시작
                    </p>
                    {ct.note && <p className="text-slate-500 text-xs">{ct.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card mb-5">
        <div className="px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold flex items-center gap-2">📊 일정 제출 현황</h2>
            <span className="font-bold text-sm">
              <span className={allSubmitted ? 'text-green-400' : 'text-[#4f8ef7]'}>{submittedMembers.length}</span>
              <span className="text-slate-600"> / {total}명</span>
            </span>
          </div>
          <div className="w-full bg-[#1a2540] rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${submitRatio}%`,
                background: allSubmitted ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#4f8ef7,#3a6fd4)',
              }}
            />
          </div>
          {allSubmitted && (
            <p className="text-green-400 text-xs mt-2 font-semibold">
              ✓ 전원 제출 완료! 최적 시간 탭에서 레이드 시간을 확인하세요.
            </p>
          )}
          {notSubmitted.length > 0 && (
            <p className="text-slate-600 text-xs mt-1.5">미제출: {notSubmitted.map((m) => m.name).join(', ')}</p>
          )}
        </div>

        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {config.members.map((member, idx) => {
            const color = member.color || MEMBER_COLORS[idx % MEMBER_COLORS.length];
            const submitted = schedule?.memberSchedules?.[member.id] !== undefined;
            return (
              <div
                key={member.id}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all ${
                  submitted ? 'border-green-500/20 bg-green-500/8' : 'border-[#1e2d4a] bg-[#0c1121]'
                }`}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: submitted ? color : '#1e2d4a' }}
                >
                  {member.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${submitted ? 'text-slate-200' : 'text-slate-600'}`}>
                    {member.name}
                  </p>
                  <p className={`text-xs font-medium ${submitted ? 'text-green-500' : 'text-slate-600'}`}>
                    {submitted ? '✓ 제출완료' : '미제출'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-[#1e2d4a]">
          <h2 className="text-white font-bold flex items-center gap-2">📅 날짜별 참여 현황</h2>
          <p className="text-[#3a5278] text-xs mt-0.5">제출한 멤버 기준으로 표시됩니다</p>
        </div>

        <div className="divide-y divide-[#1e2d4a]">
          {days.map((day) => {
            const dateStr = formatDate(day);
            const weekend = isWeekend(day);

            type AbsentEntry = { member: (typeof config.members)[0]; detail: string };
            const absentMembers: AbsentEntry[] = [];

            config.members.forEach((member) => {
              const sched = schedule?.memberSchedules?.[member.id];
              if (!sched) return;
              const daySlots = sched.unavailableSlots.filter((s) => s.date === dateStr);
              if (!daySlots.length) return;
              const allDay = daySlots.find((s) => s.allDay);
              absentMembers.push({
                member,
                detail: allDay ? '하루종일' : daySlots.map((s) => `${s.startTime}~${s.endTime}`).join(', '),
              });
            });

            const presentCount = submittedMembers.filter((m) => !absentMembers.find((a) => a.member.id === m.id)).length;
            const presentRatio = submittedMembers.length > 0 ? (presentCount / submittedMembers.length) * 100 : 0;
            const barColor =
              presentRatio === 100 ? '#22c55e' : presentRatio >= 75 ? '#4f8ef7' : presentRatio >= 50 ? '#f59e0b' : '#ef4444';

            return (
              <div key={dateStr} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-bold text-sm flex-shrink-0 ${weekend ? 'text-red-400' : 'text-slate-200'}`}>
                    {formatDateKo(day)}
                  </span>
                  {weekend && <span className="badge badge-red">주말</span>}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-[#1a2540] rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${presentRatio}%`, backgroundColor: barColor }} />
                    </div>
                    {submittedMembers.length > 0 && (
                      <span className="text-xs font-bold flex-shrink-0 w-14 text-right" style={{ color: barColor }}>
                        {presentCount}/{submittedMembers.length}명 가능
                      </span>
                    )}
                  </div>
                </div>

                {absentMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {absentMembers.map(({ member, detail }, i) => {
                      const mi = config.members.findIndex((m) => m.id === member.id);
                      const color = member.color || MEMBER_COLORS[mi % MEMBER_COLORS.length];
                      return (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#101626] border border-[#1e2d4a] text-slate-400"
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-slate-300">{member.name}</span>
                          <span className="text-red-400 text-xs">불참 {detail}</span>
                        </span>
                      );
                    })}
                  </div>
                ) : submittedMembers.length > 0 ? (
                  <p className="text-green-600 text-xs">전원 참여 가능 🎉</p>
                ) : (
                  <p className="text-[#253352] text-xs">아직 제출한 멤버가 없습니다</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
