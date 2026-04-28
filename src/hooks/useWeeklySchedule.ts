import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { WeeklySchedule, MemberSchedule, ConfirmedTime, UnavailableSlot } from '../types';
import { getWeekId, getWeekEnd, formatDate } from '../utils/dateUtils';

export function useWeeklySchedule(weekStart: Date) {
  const weekId = getWeekId(weekStart);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'schedules', weekId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSchedule(snap.data() as WeeklySchedule);
      } else {
        const init: WeeklySchedule = {
          weekId,
          weekStart: weekId,
          weekEnd: formatDate(getWeekEnd(weekStart)),
          memberSchedules: {},
          confirmedTimes: [],
        };
        setDoc(ref, init);
        setSchedule(init);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [weekId]);

  const saveMemberSchedule = async (memberId: string, slots: UnavailableSlot[]) => {
    const ref = doc(db, 'schedules', weekId);
    const memberSched: MemberSchedule = { memberId, weekId, unavailableSlots: slots, updatedAt: Date.now() };
    await setDoc(ref, { memberSchedules: { [memberId]: memberSched } }, { merge: true });
  };

  const confirmTime = async (confirmed: ConfirmedTime) => {
    const ref = doc(db, 'schedules', weekId);
    await setDoc(ref, { confirmedTimes: [...(schedule?.confirmedTimes ?? []), confirmed] }, { merge: true });
  };

  const removeConfirmedTime = async (index: number) => {
    if (!schedule) return;
    const ref = doc(db, 'schedules', weekId);
    await setDoc(ref, { confirmedTimes: schedule.confirmedTimes.filter((_, i) => i !== index) }, { merge: true });
  };

  return { schedule, loading, saveMemberSchedule, confirmTime, removeConfirmedTime };
}
