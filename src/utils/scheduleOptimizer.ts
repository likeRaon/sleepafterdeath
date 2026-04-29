import type { Member, MemberSchedule, RaidConfig, TimeSlotScore, AppConfig } from '../types';
import { getWeekDays, formatDate, timeToMinutes, minutesToTime, isWeekend } from './dateUtils';
import { getDay } from 'date-fns';

const SLOT_STEP = 30;

function isTimeOverlapping(sStart: number, sEnd: number, uStart: number, uEnd: number): boolean {
  return sStart < uEnd && sEnd > uStart;
}

function isMemberAvailable(
  schedule: MemberSchedule,
  dateStr: string,
  slotStart: number,
  slotEnd: number,
): boolean {
  for (const slot of schedule.unavailableSlots.filter((s) => s.date === dateStr)) {
    if (slot.allDay) return false;
    const uStart = timeToMinutes(slot.startTime);
    const uEnd = slot.endTime === '00:00' ? 1440 : timeToMinutes(slot.endTime);
    if (isTimeOverlapping(slotStart, slotEnd, uStart, uEnd)) return false;
  }
  return true;
}

function sortSlots(a: TimeSlotScore, b: TimeSlotScore): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.startTime.localeCompare(b.startTime);
}

export function findOptimalSlots(
  weekStart: Date,
  memberSchedules: Record<string, MemberSchedule>,
  members: Member[],
  raid: RaidConfig,
  config: AppConfig,
  topN = 10,
): TimeSlotScore[] {
  const days = getWeekDays(weekStart);
  const duration = raid.durationMinutes;

  const allSlots: TimeSlotScore[] = [];

  for (const day of days) {
    const dateStr = formatDate(day);
    const weekend = isWeekend(day);
    const allowedStart = timeToMinutes(weekend ? config.weekendTimeStart : config.weekdayTimeStart);
    const allowedEnd = timeToMinutes(weekend ? config.weekendTimeEnd : config.weekdayTimeEnd);

    for (let start = allowedStart; start + duration <= allowedEnd; start += SLOT_STEP) {
      const end = start + duration;
      const availableMembers: Member[] = [];
      const unavailableMembers: Member[] = [];
      const notSubmittedMembers: Member[] = [];

      for (const member of members) {
        const schedule = memberSchedules[member.id];
        if (!schedule) {
          notSubmittedMembers.push(member);
        } else if (isMemberAvailable(schedule, dateStr, start, end)) {
          availableMembers.push(member);
        } else {
          unavailableMembers.push(member);
        }
      }

      allSlots.push({
        date: dateStr,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        availableMembers,
        unavailableMembers,
        notSubmittedMembers,
        score: availableMembers.length,
        dayOfWeek: getDay(day),
      });
    }
  }

  const byDate = new Map<string, TimeSlotScore[]>();
  for (const slot of allSlots) {
    if (!byDate.has(slot.date)) byDate.set(slot.date, []);
    byDate.get(slot.date)!.push(slot);
  }

  // 날짜 다양성 보장: 날짜별 최고 슬롯(round1) → 날짜별 두 번째 슬롯(round2) 순으로 선택
  const round1: TimeSlotScore[] = [];
  const round2: TimeSlotScore[] = [];

  for (const [, daySlots] of byDate) {
    daySlots.sort((a, b) => b.score - a.score || a.startTime.localeCompare(b.startTime));

    const first = daySlots[0];
    if (!first) continue;
    round1.push(first);

    const f1Start = timeToMinutes(first.startTime);
    const f1End = timeToMinutes(first.endTime);

    for (const slot of daySlots.slice(1)) {
      const sStart = timeToMinutes(slot.startTime);
      const sEnd = timeToMinutes(slot.endTime);
      if (sStart >= f1End || sEnd <= f1Start) {
        round2.push(slot);
        break;
      }
    }
  }

  round1.sort(sortSlots);
  round2.sort(sortSlots);

  const seen = new Set<string>();
  const combined: TimeSlotScore[] = [];

  for (const slot of [...round1, ...round2]) {
    const key = `${slot.date}-${slot.startTime}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(slot);
    }
  }

  return combined.slice(0, topN);
}
