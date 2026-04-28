export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface UnavailableSlot {
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm" — "00:00"은 자정(1440분)
  allDay: boolean;
}

export interface MemberSchedule {
  memberId: string;
  weekId: string;
  unavailableSlots: UnavailableSlot[];
  updatedAt: number;
}

export interface RaidConfig {
  id: string;
  name: string;
  requiredMembers: number;
  durationMinutes: number;
}

export interface ConfirmedTime {
  raidId: string;
  date: string;      // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  note: string;
  confirmedAt: number;
}

export interface WeeklySchedule {
  weekId: string;   // 수요일 기준 "YYYY-MM-DD"
  weekStart: string;
  weekEnd: string;
  memberSchedules: Record<string, MemberSchedule>;
  confirmedTimes: ConfirmedTime[];
}

export interface AppConfig {
  members: Member[];
  raids: RaidConfig[];
  adminPassword: string;
  discordWebhookUrl: string;
  weekdayTimeStart: string;
  weekdayTimeEnd: string;
  weekendTimeStart: string;
  weekendTimeEnd: string;
}

export interface TimeSlotScore {
  date: string;
  startTime: string;
  endTime: string;
  availableMembers: Member[];
  unavailableMembers: Member[];
  score: number;
  dayOfWeek: number;
}
