import type { ConfirmedTime, AppConfig } from '../types';
import { formatDateKo, parseDate } from './dateUtils';

export async function sendDiscordNotification(
  confirmed: ConfirmedTime,
  config: AppConfig,
): Promise<boolean> {
  if (!config.discordWebhookUrl) return false;

  const raid = config.raids.find((r) => r.id === confirmed.raidId);
  const raidName = raid ? raid.name : '레이드';
  const dateKo = formatDateKo(parseDate(confirmed.date));

  const endMinutes =
    parseInt(confirmed.startTime.split(':')[0]) * 60 +
    parseInt(confirmed.startTime.split(':')[1]) +
    (raid?.durationMinutes ?? 120);
  const endH = Math.floor(endMinutes / 60) % 24;
  const endM = endMinutes % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const payload = {
    embeds: [
      {
        title: `⚔️ ${raidName} 일정 확정!`,
        color: 0xc9a227,
        fields: [
          {
            name: '📅 날짜',
            value: dateKo,
            inline: true,
          },
          {
            name: '🕐 시간',
            value: `${confirmed.startTime} ~ ${endTime}`,
            inline: true,
          },
          ...(confirmed.note
            ? [{ name: '📝 메모', value: confirmed.note, inline: false }]
            : []),
        ],
        footer: {
          text: '아이온2 레이드 스케줄러',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
