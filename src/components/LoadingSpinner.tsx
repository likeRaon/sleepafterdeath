export default function LoadingSpinner({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400">{text}</p>
    </div>
  );
}
