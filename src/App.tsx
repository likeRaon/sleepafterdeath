import { useState } from 'react';
import { createHashRouter, RouterProvider, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import InputPage from './pages/InputPage';
import SchedulePage from './pages/SchedulePage';
import OptimalPage from './pages/OptimalPage';
import AdminPage from './pages/AdminPage';
import SetupPage from './pages/SetupPage';
import { useAppConfig } from './hooks/useAppConfig';
import { useWeeklySchedule } from './hooks/useWeeklySchedule';
import { getWeekStart } from './utils/dateUtils';
import { sendDiscordNotification } from './utils/discord';
import type { ConfirmedTime } from './types';

const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here';

function AppContent() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const { config, loading: configLoading, updateConfig } = useAppConfig();
  const { schedule, loading: schedLoading, saveMemberSchedule, confirmTime, removeConfirmedTime } =
    useWeeklySchedule(weekStart);

  if (configLoading || schedLoading) {
    return <LoadingSpinner text="데이터 불러오는 중..." />;
  }

  if (!config) return <LoadingSpinner text="설정 초기화 중..." />;

  const handleConfirm = async (ct: ConfirmedTime) => {
    await confirmTime(ct);
    // 디스코드 알림
    try {
      await sendDiscordNotification(ct, config);
    } catch {
      // 알림 실패는 무시
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <InputPage
                config={config}
                weekStart={weekStart}
                onChangeWeek={setWeekStart}
                memberSchedules={schedule?.memberSchedules ?? {}}
                onSave={saveMemberSchedule}
              />
            }
          />
          <Route
            path="/schedule"
            element={
              <SchedulePage
                config={config}
                weekStart={weekStart}
                onChangeWeek={setWeekStart}
                schedule={schedule}
              />
            }
          />
          <Route
            path="/optimal"
            element={
              <OptimalPage
                config={config}
                weekStart={weekStart}
                onChangeWeek={setWeekStart}
                schedule={schedule}
                onConfirm={handleConfirm}
                onRemoveConfirmed={removeConfirmedTime}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminPage
                config={config}
                onUpdateConfig={updateConfig}
                confirmedTimes={schedule?.confirmedTimes ?? []}
                onRemoveConfirmed={removeConfirmedTime}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const setupRouter = createHashRouter([
  { path: '*', element: (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 bg-[#111827] border-b border-[#2a3050] shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <h1 className="text-[#c9a227] font-bold text-lg">아이온2 레이드 스케줄러</h1>
        </div>
      </div>
      <SetupPage />
    </div>
  )},
]);

const appRouter = createHashRouter([
  { path: '*', element: <AppContent /> },
]);

export default function App() {
  if (!isFirebaseConfigured) {
    return <RouterProvider router={setupRouter} />;
  }
  return <RouterProvider router={appRouter} />;
}
