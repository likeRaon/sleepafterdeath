import { useState, useRef, useMemo } from 'react';
import { useBlocker } from 'react-router-dom';
import type { Member, UnavailableSlot, AppConfig } from '../types';
import { getWeekDays, formatDateKo, formatDate, isWeekend } from '../utils/dateUtils';
import WeekNav from '../components/WeekNav';
import TimePicker from '../components/TimePicker';

const ARTISAN_START = '21:30';
const ARTISAN_END = '22:30';

interface InputPageProps {
  config: AppConfig;
  weekStart: Date;
  onChangeWeek: (d: Date) => void;
  memberSchedules: Record<string, { unavailableSlots: UnavailableSlot[] }>;
  onSave: (memberId: string, slots: UnavailableSlot[]) => Promise<void>;
}

const MEMBER_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#e879f9',
];

export default function InputPage({ config, weekStart, onChangeWeek, memberSchedules, onSave }: InputPageProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [slots, setSlots] = useState<UnavailableSlot[]>([]);
  const [savedSlots, setSavedSlots] = useState<UnavailableSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);
  const days = getWeekDays(weekStart);

  const hasUnsavedChanges = useMemo(
    () => !!selectedMember && JSON.stringify(slots) !== JSON.stringify(savedSlots),
    [selectedMember, slots, savedSlots],
  );

  const blocker = useBlocker(hasUnsavedChanges);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    const existing = memberSchedules[member.id]?.unavailableSlots ?? [];
    setSlots(existing);
    setSavedSlots(existing);
    setSaved(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const toggleAllDay = (dateStr: string) => {
    const exists = slots.find((s) => s.date === dateStr && s.allDay);
    if (exists) {
      setSlots((prev) => prev.filter((s) => !(s.date === dateStr && s.allDay)));
    } else {
      setSlots((prev) => [
        ...prev.filter((s) => s.date !== dateStr),
        { date: dateStr, startTime: '00:00', endTime: '00:00', allDay: true },
      ]);
    }
  };

  const addTimeSlot = (dateStr: string, weekend: boolean) =>
    setSlots((prev) => [
      ...prev,
      { date: dateStr, startTime: weekend ? '13:00' : '20:00', endTime: '22:00', allDay: false },
    ]);

  const updateSlot = (idx: number, field: keyof UnavailableSlot, value: string | boolean) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

  const removeSlot = (idx: number) => setSlots((prev) => prev.filter((_, i) => i !== idx));

  // 수요일(days[0])·토요일(days[3]) 21:30~22:30 자동 등록
  const applyArtisanSlots = () => {
    const targets = [formatDate(days[0]), formatDate(days[3])];
    setSlots((prev) => {
      let next = [...prev];
      for (const dateStr of targets) {
        const exists = next.some(
          (s) => s.date === dateStr && !s.allDay && s.startTime === ARTISAN_START && s.endTime === ARTISAN_END,
        );
        if (!exists) {
          next = [...next, { date: dateStr, startTime: ARTISAN_START, endTime: ARTISAN_END, allDay: false }];
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedMember) return;
    setSaving(true);
    await onSave(selectedMember.id, slots);
    setSavedSlots(slots);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const totalAbsent = slots.filter((s) => s.allDay).length;
  const totalTimeSlots = slots.filter((s) => !s.allDay).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <WeekNav weekStart={weekStart} onChangeWeek={onChangeWeek} />

      {showGuide && (
        <div className="relative card-inner mb-5 p-4 border border-[#4f8ef7]/20">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#4f8ef7] to-[#3a6fd4] rounded-l-xl" />
          <button
            onClick={() => setShowGuide(false)}
            className="absolute top-3 right-3 text-slate-600 hover:text-slate-400 text-lg transition-colors"
          >×</button>
          <p className="text-[#4f8ef7] font-bold text-xs mb-2.5 ml-2">💡 사용법 — 3단계로 끝!</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 ml-2">
            {[
              { n: 1, text: '본인 닉네임을 선택하세요.' },
              { n: 2, text: '불참 날짜 혹은 시간을 선택하세요.' },
              { n: 3, text: '저장하기를 눌러 일정을 저장하세요.' },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#3a5278] hidden sm:block mx-2 text-sm">→</span>}
                <span className="w-5 h-5 rounded-full bg-[#4f8ef7] text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                  {s.n}
                </span>
                <span className="text-slate-400 text-xs">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-5">
        <div className="px-5 py-4 border-b border-[#1e2d4a]">
          <h2 className="text-white font-bold">👤 내 이름 선택</h2>
        </div>
        <div className="p-5">
          {config.members.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3 opacity-40">🔧</div>
              <p className="text-slate-500 text-sm">관리자 탭에서 멤버를 추가해주세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: '정식 멤버', members: config.members.filter((m) => !m.isMercenary) },
                { label: '용병', members: config.members.filter((m) => m.isMercenary) },
              ]
                .filter(({ members }) => members.length > 0)
                .map(({ label, members }) => (
                  <div key={label}>
                    <p className="text-slate-500 text-xs font-semibold mb-2">{label}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {members.map((member) => {
                        const idx = config.members.findIndex((m) => m.id === member.id);
                        const color = member.color || MEMBER_COLORS[idx % MEMBER_COLORS.length];
                        const submitted = memberSchedules[member.id] !== undefined;
                        const isSelected = selectedMember?.id === member.id;
                        return (
                          <button
                            key={member.id}
                            onClick={() => handleSelectMember(member)}
                            className={`relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-[#4f8ef7] bg-[#4f8ef7]/10 text-white shadow-lg shadow-[#4f8ef7]/10'
                                : 'border-[#1e2d4a] bg-[#0c1121] text-slate-400 hover:border-[#253352] hover:bg-[#101626]'
                            }`}
                          >
                            {submitted && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-sm">
                                ✓
                              </span>
                            )}
                            {member.isMercenary && !submitted && (
                              <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-[#c9a227] bg-[#c9a227]/10 border border-[#c9a227]/25 px-1 py-0.5 rounded leading-none">
                                용병
                              </span>
                            )}
                            {member.isMercenary && submitted && (
                              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-[#c9a227] bg-[#c9a227]/10 border border-[#c9a227]/25 px-1 py-0.5 rounded leading-none">
                                용병
                              </span>
                            )}
                            <span
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-base shadow-md"
                              style={{ backgroundColor: color }}
                            >
                              {member.name.charAt(0)}
                            </span>
                            <span className="text-sm font-semibold">{member.name}</span>
                            <span className={`text-xs font-medium ${submitted ? 'text-green-500' : 'text-slate-600'}`}>
                              {submitted ? '제출완료' : '미제출'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {!selectedMember && config.members.length > 0 && (
        <div className="text-center py-12 text-slate-600">
          <div className="text-5xl mb-3 opacity-30">☝️</div>
          <p className="font-semibold">위에서 닉네임을 먼저 선택해 주세요.</p>
        </div>
      )}

      {selectedMember && (
        <div ref={formRef} className="card">
          <div className="px-5 py-4 border-b border-[#1e2d4a]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full flex-shrink-0 shadow-md" style={{ backgroundColor: selectedMember.color || '#4f8ef7' }} />
                <h2 className="text-white font-bold">{selectedMember.name}님의 불참 시간 입력</h2>
              </div>
              <button
                onClick={applyArtisanSlots}
                className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', boxShadow: '0 2px 14px rgba(124,58,237,0.45)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 22px rgba(124,58,237,0.65)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 14px rgba(124,58,237,0.45)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
                title="수요일·토요일 21:30~22:30 자동 등록"
              >
                🎭 아티쟁 시간
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#1e2d4a]">
            {days.map((day) => {
              const dateStr = formatDate(day);
              const weekend = isWeekend(day);
              const daySlots = slots.filter((s) => s.date === dateStr);
              const allDaySlot = daySlots.find((s) => s.allDay);
              const timeSlots = daySlots.filter((s) => !s.allDay);
              const hasAbsence = allDaySlot || timeSlots.length > 0;

              return (
                <div
                  key={dateStr}
                  className={`px-5 py-4 transition-colors ${allDaySlot ? 'bg-red-950/15' : hasAbsence ? 'bg-orange-950/10' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm flex-shrink-0">
                        {allDaySlot ? '🔴' : timeSlots.length > 0 ? '🟡' : '🟢'}
                      </span>
                      <span className={`font-bold text-sm ${weekend ? 'text-red-400' : 'text-slate-200'}`}>
                        {formatDateKo(day)}
                      </span>
                      <span className="text-xs hidden sm:block" style={{ color: '#3a5278' }}>
                        {weekend ? '13:00 ~ 자정' : '20:00 ~ 자정'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAllDay(dateStr)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          allDaySlot
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-[#1a2540] text-slate-500 border border-[#1e2d4a] hover:border-red-500/30 hover:text-red-400'
                        }`}
                      >
                        {allDaySlot ? '🔴 하루 불참 취소' : '하루 종일 불참'}
                      </button>
                      {!allDaySlot && (
                        <button
                          onClick={() => addTimeSlot(dateStr, weekend)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#4f8ef7]/10 text-[#4f8ef7] border border-[#4f8ef7]/25 hover:bg-[#4f8ef7]/20 transition-all"
                        >
                          + 시간 추가
                        </button>
                      )}
                    </div>
                  </div>

                  {!allDaySlot && timeSlots.length > 0 && (
                    <div className="mt-3 space-y-2 ml-6">
                      {timeSlots.map((slot) => {
                        const slotIdx = slots.indexOf(slot);
                        return (
                          <div
                            key={slotIdx}
                            className="flex items-center gap-3 bg-[#0c1121] rounded-xl px-4 py-3 border border-orange-500/15"
                          >
                            <span className="text-orange-400 text-xs font-bold w-14 flex-shrink-0">불참 시간</span>
                            <div className="flex items-center gap-2 flex-1 flex-wrap">
                              <TimePicker value={slot.startTime} onChange={(v) => updateSlot(slotIdx, 'startTime', v)} />
                              <span className="text-[#3a5278]">~</span>
                              <TimePicker value={slot.endTime} onChange={(v) => updateSlot(slotIdx, 'endTime', v)} />
                            </div>
                            <button
                              onClick={() => removeSlot(slotIdx)}
                              className="text-slate-600 hover:text-red-400 transition-colors text-xl flex-shrink-0"
                              aria-label="삭제"
                            >×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {allDaySlot && (
                    <div className="mt-2 ml-6">
                      <span className="badge badge-red">이 날은 하루 종일 참여 불가</span>
                    </div>
                  )}

                  {!hasAbsence && (
                    <p className="text-[#253352] text-xs mt-1 ml-6">참여 가능</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-[#1e2d4a] bg-[#0c1121] flex items-center justify-between gap-4">
            <div className="text-xs hidden sm:flex items-center gap-3">
              {totalAbsent > 0 && <span className="badge badge-red">🔴 하루 불참 {totalAbsent}일</span>}
              {totalTimeSlots > 0 && (
                <span className="badge" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)' }}>
                  🟡 시간 불참 {totalTimeSlots}건
                </span>
              )}
              {totalAbsent === 0 && totalTimeSlots === 0 && (
                <span className="badge badge-green">🟢 이번 주 전체 참여 가능</span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`ml-auto btn py-2.5 px-7 ${saved ? 'bg-green-600 text-white' : 'btn-primary'}`}
            >
              {saving ? '저장 중...' : saved ? '✓ 저장 완료!' : '저장하기'}
            </button>
          </div>
        </div>
      )}

      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-white font-black text-lg text-center mb-1">저장하지 않고 나가시겠어요?</h3>
            <p className="text-slate-500 text-sm text-center mb-6 leading-relaxed">
              입력한 일정이 저장되지 않았습니다.
              <br />
              페이지를 나가면 변경사항이 사라집니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => blocker.reset()} className="flex-1 btn btn-ghost py-3 font-bold">
                취소
              </button>
              <button
                onClick={() => blocker.proceed()}
                className="flex-1 btn py-3 font-bold"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 2px 12px rgba(239,68,68,0.35)' }}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
