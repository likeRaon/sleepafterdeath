import { format, addDays, startOfDay, parseISO, getDay } from 'date-fns';

// 주 시작: 수요일(3) 기준, 수~화 순환
export function getWeekStart(date: Date = new Date()): Date {
  const day = getDay(date);
  const diff = day >= 3 ? -(day - 3) : -(day + 4);
  return startOfDay(addDays(date, diff));
}

export function getWeekEnd(weekStart: Date): Date {
  return addDays(weekStart, 6);
}

export function getWeekId(weekStart: Date): string {
  return format(weekStart, 'yyyy-MM-dd');
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateKo(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${format(date, 'M/d')}(${days[getDay(date)]})`;
}

export function isWeekend(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6;
}

// "00:00"과 "24:00"은 자정(1440분)으로 통일
export function timeToMinutes(time: string): number {
  if (time === '00:00' || time === '24:00') return 1440;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  if (minutes >= 1440) return '24:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: string): string {
  return time === '24:00' ? '00:00' : time;
}

export function getAllowedTimeRange(
  date: Date,
  weekdayStart: string,
  weekdayEnd: string,
  weekendStart: string,
  weekendEnd: string,
): { start: number; end: number } {
  return isWeekend(date)
    ? { start: timeToMinutes(weekendStart), end: timeToMinutes(weekendEnd) }
    : { start: timeToMinutes(weekdayStart), end: timeToMinutes(weekdayEnd) };
}

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}
