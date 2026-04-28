import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { AppConfig, WeeklySchedule, TimeSlotScore, ConfirmedTime } from '../types';
import { findOptimalSlots } from '../utils/scheduleOptimizer';
import { formatDateKo, parseDate } from '../utils/dateUtils';
import WeekNav from '../components/WeekNav';

const MAX_CONFIRMED = 2;

interface OptimalPageProps {
  config: AppConfig;
  weekStart: Date;
  onChangeWeek: (d: Date) => void;
  schedule: WeeklySchedule | null;
  onConfirm: (ct: ConfirmedTime) => Promise<void>;
  onRemoveConfirmed: (idx: number) => Promise<void>;
}

const MEMBER_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#818cf8', '#e879f9',
];

export default function OptimalPage({ config, weekStart, onChangeWeek, schedule, onConfirm, onRemoveConfirmed }: OptimalPageProps) {
  const [selectedRaidId, setSelectedRaidId] = useState(config.raids[0]?.id ?? '');
  const [confirmModal, setConfirmModal] = useState<TimeSlotScore | null>(null);
  const [confirmNote, setConfirmNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'warn' | 'info' } | null>(null);

  const selectedRaid = config.raids.find((r) => r.id === selectedRaidId) ?? config.raids[0];
  const confirmedTimes = schedule?.confirmedTimes ?? [];

  const optimalSlots = useMemo(() => {
    if (!selectedRaid || !schedule) return [];
    return findOptimalSlots(weekStart, schedule.memberSchedules ?? {}, config.members, selectedRaid, config, 10);
  }, [weekStart, schedule, config, selectedRaid]);

  const groupedSlots = useMemo(() => {
    const map = new Map<string, TimeSlotScore[]>();
    optimalSlots.forEach((slot) => {
      if (!map.has(slot.date)) map.set(slot.date, []);
      map.get(slot.date)!.push(slot);
    });
    return Array.from(map.entries()).map(([date, slots]) => ({ date, slots }));
  }, [optimalSlots]);

  const submittedCount = config.members.filter((m) => schedule?.memberSchedules?.[m.id] !== undefined).length;

  const getConfirmedIdx = (slot: TimeSlotScore) =>
    confirmedTimes.findIndex((ct) => ct.date === slot.date && ct.startTime === slot.startTime && ct.raidId === selectedRaid?.id);

  const showToast = (msg: string, type: 'success' | 'warn' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleConfirm = async () => {
    if (!confirmModal || !selectedRaid) return;
    setConfirming(true);
    await onConfirm({
      raidId: selectedRaid.id,
      date: confirmModal.date,
      startTime: confirmModal.startTime,
      note: confirmNote,
      confirmedAt: Date.now(),
    });
    setConfirming(false);
    setConfirmModal(null);
    setConfirmNote('');
    showToast('레이드 일정이 확정되었습니다! 디스코드로 알림을 보냈습니다. 🎉');
  };

  const handleToggle = async (slot: TimeSlotScore) => {
    const idx = getConfirmedIdx(slot);
    if (idx >= 0) {
      setRemoving(idx);
      await onRemoveConfirmed(idx);
      setRemoving(null);
      showToast('일정 확정이 해제되었습니다.', 'info');
    } else {
      if (confirmedTimes.length >= MAX_CONFIRMED) {
        showToast(`이번 주 최대 ${MAX_CONFIRMED}개까지만 확정 가능합니다. 기존 확정을 해제 후 선택해주세요.`, 'warn');
        return;
      }
      setConfirmModal(slot);
      setConfirmNote('');
    }
  };

  const globalRankOf = (slot: TimeSlotScore) => optimalSlots.indexOf(slot) + 1;

  const toastCls =
    toast?.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300'
    : toast?.type === 'warn' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
    : 'bg-blue-500/10 border-blue-500/30 text-blue-300';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <WeekNav weekStart={weekStart} onChangeWeek={onChangeWeek} />

      {toast && (
        <div className={`mb-4 border rounded-xl px-4 py-3.5 text-sm flex items-start gap-3 ${toastCls}`}>
          <span className="flex-shrink-0 mt-0.5">{toast.type === 'success' ? '✓' : toast.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
          <p>{toast.msg}</p>
        </div>
      )}

      {confirmedTimes.length > 0 && (
        <div className="card mb-5 glow-gold">
          <div className="px-5 py-3.5 border-b border-[#1e2d4a] flex items-center justify-between">
            <h3 className="text-gradient-gold font-bold text-sm flex items-center gap-2">⚔️ 이번 주 확정 일정</h3>
            <span className="badge badge-gold">{confirmedTimes.length} / {MAX_CONFIRMED}</span>
          </div>
          <div className="p-4 space-y-2">
            {confirmedTimes.map((ct, idx) => {
              const raid = config.raids.find((r) => r.id === ct.raidId);
              return (
                <div key={idx} className="card-inner flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-white font-bold text-sm">{raid?.name ?? '레이드'}</p>
                    <p className="text-[#c9a227] text-xs mt-0.5">
                      {formatDateKo(parseDate(ct.date))} · {ct.startTime} 시작
                    </p>
                    {ct.note && <p className="text-slate-500 text-xs mt-0.5">{ct.note}</p>}
                  </div>
                  <button
                    onClick={async () => { setRemoving(idx); await onRemoveConfirmed(idx); setRemoving(null); showToast('확정 해제되었습니다.', 'info'); }}
                    disabled={removing === idx}
                    className="btn btn-ghost text-xs px-3 py-1.5 text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10"
                  >
                    {removing === idx ? '...' : '해제'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {config.raids.length > 1 && (
        <div className="card-inner mb-4 p-3 flex gap-2 flex-wrap">
          <p className="text-slate-600 text-xs w-full">레이드 선택</p>
          {config.raids.map((raid) => (
            <button
              key={raid.id}
              onClick={() => setSelectedRaidId(raid.id)}
              className={`btn text-sm py-1.5 px-4 ${selectedRaidId === raid.id ? 'btn-primary' : 'btn-ghost'}`}
            >
              {raid.name}
            </button>
          ))}
        </div>
      )}

      <div className="card-inner mb-5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm font-semibold">일정 제출 현황</span>
          <span className={`font-bold text-sm ${submittedCount === config.members.length ? 'text-green-400' : 'text-[#4f8ef7]'}`}>
            {submittedCount} <span className="text-slate-600 font-normal">/ {config.members.length}명</span>
          </span>
        </div>
        <div className="w-full bg-[#1a2540] rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${config.members.length > 0 ? (submittedCount / config.members.length) * 100 : 0}%`,
              background: submittedCount === config.members.length
                ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                : 'linear-gradient(90deg,#4f8ef7,#3a6fd4)',
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {config.members.map((m, idx) => {
            const color = m.color || MEMBER_COLORS[idx % MEMBER_COLORS.length];
            const submitted = schedule?.memberSchedules?.[m.id] !== undefined;
            return (
              <span
                key={m.id}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${
                  submitted ? 'border-[#1e2d4a] bg-[#101626] text-slate-300' : 'border-dashed border-[#1e2d4a] text-slate-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: submitted ? color : '#374151' }} />
                {m.name}
              </span>
            );
          })}
        </div>
        {submittedCount < config.members.length && (
          <p className="text-slate-600 text-xs mt-2.5">
            💡 <Link to="/" className="text-[#4f8ef7] hover:underline">일정 입력 탭</Link>에서 모든 멤버가 제출할수록 더 정확한 결과가 나옵니다.
          </p>
        )}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-[#1e2d4a]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <span>✨</span> 최적 레이드 시간 추천
              </h2>
              {selectedRaid && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="badge badge-blue">{selectedRaid.name}</span>
                  <span className="badge badge-blue">⏱ {selectedRaid.durationMinutes}분</span>
                  <span className="badge badge-blue">👥 {selectedRaid.requiredMembers}인</span>
                </div>
              )}
            </div>
            <span className={`badge flex-shrink-0 ${confirmedTimes.length >= MAX_CONFIRMED ? 'badge-gold' : 'badge-blue'}`}>
              확정 {confirmedTimes.length}/{MAX_CONFIRMED}
            </span>
          </div>
        </div>

        {optimalSlots.length === 0 ? (
          <div className="p-14 text-center">
            <div className="text-5xl mb-4 opacity-30">📭</div>
            <p className="text-slate-400 font-semibold mb-1">아직 데이터가 없습니다</p>
            <p className="text-slate-600 text-sm mb-5">멤버들이 못 오는 시간을 입력하면 자동으로 최적 시간을 계산합니다.</p>
            <Link to="/" className="btn btn-primary">✏️ 일정 입력하러 가기</Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2d4a]">
            {groupedSlots.map(({ date, slots: daySlots }) => {
              const dayDate = parseDate(date);
              const isWeekend = [0, 6].includes(dayDate.getDay());
              return (
                <div key={date}>
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-[#0c1121]/80 border-b border-[#1e2d4a]">
                    <span className={`text-sm font-black ${isWeekend ? 'text-red-400' : 'text-slate-300'}`}>
                      {formatDateKo(dayDate)}
                    </span>
                    {isWeekend && <span className="badge badge-red">주말</span>}
                    <div className="h-px flex-1 bg-[#1e2d4a]" />
                    <span className="text-slate-600 text-xs">{daySlots.length}개 옵션</span>
                  </div>

                  {daySlots.map((slot) => {
                    const total = config.members.length;
                    const ratio = total > 0 ? slot.score / total : 0;
                    const rank = globalRankOf(slot);
                    const confirmedIdx = getConfirmedIdx(slot);
                    const isConfirmed = confirmedIdx >= 0;
                    const isAtMax = confirmedTimes.length >= MAX_CONFIRMED;
                    const barColor =
                      ratio >= 1 ? '#22c55e' : ratio >= 0.875 ? '#4f8ef7' : ratio >= 0.75 ? '#f59e0b' : '#ef4444';

                    return (
                      <div
                        key={`${slot.date}-${slot.startTime}`}
                        className={`px-5 py-4 transition-all ${
                          isConfirmed
                            ? 'bg-[#c9a227]/6 border-l-2 border-l-[#c9a227]'
                            : 'border-l-2 border-l-transparent hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-7 text-center flex-shrink-0 pt-0.5">
                            {isConfirmed ? (
                              <span className="text-lg">✅</span>
                            ) : rank <= 3 ? (
                              <span className="text-lg">{['🥇', '🥈', '🥉'][rank - 1]}</span>
                            ) : (
                              <span className="text-[#3a5278] text-xs font-black font-mono">#{rank}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                              <span className="text-gradient-blue font-black text-base font-mono tracking-tight">
                                {slot.startTime} ~ {slot.endTime}
                              </span>
                              {isConfirmed && <span className="badge badge-gold">✓ 확정됨</span>}
                              {!isConfirmed && rank === 1 && !isAtMax && (
                                <span className="badge badge-blue">최우선 추천</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 mb-3">
                              <div className="flex-1 bg-[#1a2540] rounded-full h-2 overflow-hidden">
                                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: barColor }} />
                              </div>
                              <span className="text-xs font-bold flex-shrink-0 w-12 text-right" style={{ color: barColor }}>
                                {slot.score}/{total}명
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {slot.availableMembers.map((m) => {
                                const mi = config.members.findIndex((cm) => cm.id === m.id);
                                const color = m.color || MEMBER_COLORS[mi % MEMBER_COLORS.length];
                                return (
                                  <span key={m.id} className="flex items-center gap-1 text-[11px] text-slate-300 bg-green-500/8 border border-green-500/15 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                    {m.name}
                                  </span>
                                );
                              })}
                              {slot.unavailableMembers.map((m) => {
                                const mi = config.members.findIndex((cm) => cm.id === m.id);
                                const color = m.color || MEMBER_COLORS[mi % MEMBER_COLORS.length];
                                return (
                                  <span key={m.id} className="flex items-center gap-1 text-xs text-slate-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full line-through">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                    {m.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggle(slot)}
                            disabled={removing !== null || (isAtMax && !isConfirmed)}
                            className={`flex-shrink-0 btn text-xs py-2 px-3.5 ${
                              isConfirmed
                                ? 'btn-ghost text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/8'
                                : isAtMax
                                ? 'btn-ghost text-slate-600 cursor-not-allowed'
                                : rank === 1
                                ? 'btn-gold'
                                : 'badge-gold border border-[#c9a227]/30 text-[#c9a227] hover:bg-[#c9a227]/15'
                            }`}
                          >
                            {isConfirmed ? '해제' : isAtMax ? '최대' : '확정'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="card glow-gold w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-gradient-gold font-black text-lg mb-1">⚔️ 레이드 일정 확정</h3>
            <p className="text-slate-500 text-xs mb-5">확정 후 디스코드로 자동 알림이 전송됩니다.</p>

            <div className="card-inner p-4 mb-4">
              <p className="text-slate-400 text-xs mb-2">📋 확정 내용</p>
              <p className="text-white font-black text-lg">{selectedRaid?.name}</p>
              <p className="text-gradient-blue font-mono font-bold mt-1">
                {formatDateKo(parseDate(confirmModal.date))} &nbsp; {confirmModal.startTime} ~ {confirmModal.endTime}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 bg-[#1a2540] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(confirmModal.score / config.members.length) * 100}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }}
                  />
                </div>
                <span className="text-green-400 text-xs font-bold">{confirmModal.score}/{config.members.length}명 참여</span>
              </div>
              {confirmModal.unavailableMembers.length > 0 && (
                <p className="text-red-400 text-xs mt-1.5">불참: {confirmModal.unavailableMembers.map((m) => m.name).join(', ')}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-slate-500 text-xs mb-1.5">메모 (선택)</label>
              <input
                type="text"
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                placeholder="예: 1주차 클리어 목표"
                className="input-base"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="btn btn-ghost flex-1 py-3">취소</button>
              <button onClick={handleConfirm} disabled={confirming} className="btn btn-gold flex-1 py-3">
                {confirming ? '확정 중...' : '✓ 확정하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
