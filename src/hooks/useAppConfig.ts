import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  members: [],
  raids: [{ id: 'raid-1', name: '군단장 레이드', requiredMembers: 8, durationMinutes: 120 }],
  adminPassword: 'admin1234',
  discordWebhookUrl: '',
  weekdayTimeStart: '20:00',
  weekdayTimeEnd: '24:00',
  weekendTimeStart: '13:00',
  weekendTimeEnd: '24:00',
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'app', 'config');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AppConfig);
      } else {
        setDoc(ref, DEFAULT_CONFIG);
        setConfig(DEFAULT_CONFIG);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const ref = doc(db, 'app', 'config');
    await setDoc(ref, { ...config, ...updates } as AppConfig);
  };

  return { config, loading, updateConfig };
}
