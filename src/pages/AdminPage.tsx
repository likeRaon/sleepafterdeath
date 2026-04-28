import { useState } from 'react';
import type { AppConfig, Member, RaidConfig, ConfirmedTime } from '../types';
import { formatDateKo, parseDate } from '../utils/dateUtils';

interface AdminPageProps {
  config: AppConfig;
  onUpdateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  confirmedTimes: ConfirmedTime[];
  onRemoveConfirmed: (idx: number) => Promise<void>;
}

const MEMBER_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#818cf8', '#e879f9',
];

export default function AdminPage({ config, onUpdateConfig, confirmedTimes, onRemoveConfirmed }: AdminPageProps) {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newRaidName, setNewRaidName] = useState('');
  const [newRaidMembers, setNewRaidMembers] = useState(8);
  const [newRaidDuration, setNewRaidDuration] = useState(120);
  const [webhookUrl, setWebhookUrl] = useState(config.discordWebhookUrl);
  const [weekdayStart, setWeekdayStart] = useState(config.weekdayTimeStart);
  const [weekdayEnd, setWeekdayEnd] = useState(config.weekdayTimeEnd);
  const [weekendStart, setWeekendStart] = useState(config.weekendTimeStart);
  const [weekendEnd, setWeekendEnd] = useState(config.weekendTimeEnd);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleAuth = () => {
    if (password === config.adminPassword) {
      setAuthed(true);
      setAuthError('');
      setWebhookUrl(config.discordWebhookUrl);
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
    }
  };

  const addMember = async () => {
    const name = newMemberName.trim();
    if (!name) return;
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      color: MEMBER_COLORS[config.members.length % MEMBER_COLORS.length],
    };
    await onUpdateConfig({ members: [...config.members, newMember] });
    setNewMemberName('');
  };

  const removeMember = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await onUpdateConfig({ members: config.members.filter((m) => m.id !== id) });
  };

  const addRaid = async () => {
    const name = newRaidName.trim();
    if (!name) return;
    const newRaid: RaidConfig = {
      id: `raid-${Date.now()}`,
      name,
      requiredMembers: newRaidMembers,
      durationMinutes: newRaidDuration,
    };
    await onUpdateConfig({ raids: [...config.raids, newRaid] });
    setNewRaidName('');
  };

  const removeRaid = async (id: string) => {
    if (!confirm('레이드를 삭제하시겠습니까?')) return;
    await onUpdateConfig({ raids: config.raids.filter((r) => r.id !== id) });
  };

  const saveSettings = async () => {
    setSaving(true);
    const updates: Partial<AppConfig> = {
      discordWebhookUrl: webhookUrl,
      weekdayTimeStart: weekdayStart,
      weekdayTimeEnd: weekdayEnd === '00:00' ? '24:00' : weekdayEnd,
      weekendTimeStart: weekendStart,
      weekendTimeEnd: weekendEnd === '00:00' ? '24:00' : weekendEnd,
    };
    if (newPassword.trim()) updates.adminPassword = newPassword.trim();
    await onUpdateConfig(updates);
    setSaving(false);
    setSaveMsg('저장되었습니다!');
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const testWebhook = async () => {
    if (!webhookUrl) return;
    const payload = {
      embeds: [{
        title: '✅ 아이온2 레이드 스케줄러 테스트',
        description: '웹훅 연결이 정상입니다!',
        color: 0x4f6ef7,
        timestamp: new Date().toISOString(),
      }],
    };
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) alert('테스트 메시지를 전송했습니다!');
      else alert('전송 실패. 웹훅 URL을 확인해주세요.');
    } catch {
      alert('전송 실패. URL을 확인해주세요.');
    }
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-[#1a1f35] rounded-2xl border border-[#2a3050] p-8 text-center">
          <p className="text-4xl mb-4">🔐</p>
          <h2 className="text-xl font-bold text-white mb-2">관리자 인증</h2>
          <p className="text-slate-500 text-sm mb-6">관리자 비밀번호를 입력해 주세요.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            placeholder="비밀번호"
            className="w-full bg-[#111827] border border-[#2a3050] rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-[#4f6ef7] mb-3"
          />
          {authError && <p className="text-red-400 text-sm mb-3">{authError}</p>}
          <button
            onClick={handleAuth}
            className="w-full py-3 bg-[#4f6ef7] hover:bg-[#6080ff] text-white font-semibold rounded-xl transition-all"
          >
            입장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-[#1a1f35] rounded-xl border border-[#2a3050] overflow-hidden">
        <div className="p-5 border-b border-[#2a3050]">
          <h2 className="text-lg font-bold text-white">👥 멤버 관리</h2>
          <p className="text-slate-500 text-sm mt-0.5">총 {config.members.length}명</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3 mb-5">
            {config.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-[#2a3050]">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-slate-200 text-sm">{m.name}</span>
                <button onClick={() => removeMember(m.id)} className="text-slate-600 hover:text-red-400 transition-colors ml-1">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMember()}
              placeholder="새 멤버 이름"
              className="flex-1 bg-[#111827] border border-[#2a3050] rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm"
            />
            <button onClick={addMember} className="px-5 py-2.5 bg-[#4f6ef7] hover:bg-[#6080ff] text-white font-medium rounded-xl transition-all text-sm">
              추가
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1f35] rounded-xl border border-[#2a3050] overflow-hidden">
        <div className="p-5 border-b border-[#2a3050]">
          <h2 className="text-lg font-bold text-white">⚔️ 레이드 관리</h2>
        </div>
        <div className="p-5">
          <div className="space-y-3 mb-5">
            {config.raids.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 bg-[#111827] rounded-xl border border-[#2a3050]">
                <div>
                  <p className="text-slate-200 font-medium">{r.name}</p>
                  <p className="text-slate-500 text-xs">필요 인원 {r.requiredMembers}명 · 소요 {r.durationMinutes}분</p>
                </div>
                <button onClick={() => removeRaid(r.id)} className="text-slate-600 hover:text-red-400 transition-colors text-lg">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={newRaidName}
              onChange={(e) => setNewRaidName(e.target.value)}
              placeholder="레이드 이름"
              className="flex-1 min-w-40 bg-[#111827] border border-[#2a3050] rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-sm">인원</label>
              <input type="number" value={newRaidMembers} onChange={(e) => setNewRaidMembers(Number(e.target.value))}
                className="w-16 bg-[#111827] border border-[#2a3050] rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm text-center" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-sm">소요(분)</label>
              <input type="number" value={newRaidDuration} onChange={(e) => setNewRaidDuration(Number(e.target.value))} step={30}
                className="w-20 bg-[#111827] border border-[#2a3050] rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm text-center" />
            </div>
            <button onClick={addRaid} className="px-5 py-2.5 bg-[#4f6ef7] hover:bg-[#6080ff] text-white font-medium rounded-xl transition-all text-sm">
              추가
            </button>
          </div>
        </div>
      </div>

      {confirmedTimes.length > 0 && (
        <div className="bg-[#1a1f35] rounded-xl border border-[#2a3050] overflow-hidden">
          <div className="p-5 border-b border-[#2a3050]">
            <h2 className="text-lg font-bold text-white">📅 확정 일정 관리</h2>
          </div>
          <div className="p-5 space-y-3">
            {confirmedTimes.map((ct, idx) => {
              const raid = config.raids.find((r) => r.id === ct.raidId);
              return (
                <div key={idx} className="flex items-center justify-between px-4 py-3 bg-[#111827] rounded-xl border border-[#2a3050]">
                  <div>
                    <p className="text-slate-200 font-medium">{raid?.name ?? '레이드'}</p>
                    <p className="text-[#c9a227] text-sm">{formatDateKo(parseDate(ct.date))} {ct.startTime}</p>
                    {ct.note && <p className="text-slate-500 text-xs">{ct.note}</p>}
                  </div>
                  <button onClick={() => onRemoveConfirmed(idx)} className="text-slate-600 hover:text-red-400 transition-colors text-lg">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-[#1a1f35] rounded-xl border border-[#2a3050] overflow-hidden">
        <div className="p-5 border-b border-[#2a3050]">
          <h2 className="text-lg font-bold text-white">⚙️ 설정</h2>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Discord 웹훅 URL</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="flex-1 bg-[#111827] border border-[#2a3050] rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm"
              />
              <button onClick={testWebhook} className="px-4 py-2.5 bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 rounded-xl hover:bg-[#5865F2]/30 transition-all text-sm font-medium">
                테스트
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '평일 시작', value: weekdayStart, set: setWeekdayStart },
              { label: '평일 종료 (00:00 = 자정)', value: weekdayEnd === '24:00' ? '00:00' : weekdayEnd, set: setWeekdayEnd },
              { label: '주말 시작', value: weekendStart, set: setWeekendStart },
              { label: '주말 종료 (00:00 = 자정)', value: weekendEnd === '24:00' ? '00:00' : weekendEnd, set: setWeekendEnd },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-slate-400 text-sm mb-2">{label}</label>
                <input
                  type="time"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full bg-[#111827] border border-[#2a3050] rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">관리자 비밀번호 변경 (비워두면 유지)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
              className="w-full bg-[#111827] border border-[#2a3050] rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-[#4f6ef7] text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-2.5 bg-[#4f6ef7] hover:bg-[#6080ff] text-white font-semibold rounded-xl transition-all disabled:opacity-60"
            >
              {saving ? '저장 중...' : '설정 저장'}
            </button>
            {saveMsg && <span className="text-green-400 text-sm">{saveMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
