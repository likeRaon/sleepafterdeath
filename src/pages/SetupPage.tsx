export default function SetupPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-[#1a1f35] rounded-2xl border border-[#c9a227]/30 p-8">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">⚙️</p>
          <h1 className="text-2xl font-bold text-[#c9a227]">Firebase 설정 필요</h1>
          <p className="text-slate-400 mt-2">앱을 사용하려면 Firebase 프로젝트를 연결해야 합니다.</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300">
          <Step num={1} title="Firebase 프로젝트 생성">
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4f6ef7] underline"
            >
              console.firebase.google.com
            </a>
            에서 새 프로젝트를 생성하세요.
          </Step>

          <Step num={2} title="Firestore 데이터베이스 활성화">
            Firebase 콘솔 → Firestore Database → 데이터베이스 만들기 → <strong>테스트 모드</strong>로 시작
          </Step>

          <Step num={3} title=".env 파일 생성">
            프로젝트 루트에 <code className="bg-[#111827] px-1.5 py-0.5 rounded">.env</code> 파일을 만들고,{' '}
            <code className="bg-[#111827] px-1.5 py-0.5 rounded">.env.example</code>을 참고해서 Firebase 설정값을 입력하세요.
            <div className="mt-2 bg-[#111827] rounded-xl p-4 font-mono text-xs text-slate-400 border border-[#2a3050]">
              <p>VITE_FIREBASE_API_KEY=AIza...</p>
              <p>VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com</p>
              <p>VITE_FIREBASE_PROJECT_ID=your-project-id</p>
              <p>VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com</p>
              <p>VITE_FIREBASE_MESSAGING_SENDER_ID=123...</p>
              <p>VITE_FIREBASE_APP_ID=1:123...</p>
            </div>
          </Step>

          <Step num={4} title="Firestore 보안 규칙 설정 (선택)">
            Firebase 콘솔 → Firestore → 규칙 탭에서 아래와 같이 설정하면 읽기/쓰기가 모두 허용됩니다 (테스트용):
            <div className="mt-2 bg-[#111827] rounded-xl p-4 font-mono text-xs text-slate-400 border border-[#2a3050]">
              <p>rules_version = '2';</p>
              <p>service cloud.firestore {'{'}</p>
              <p>&nbsp;&nbsp;match /databases/{'{'}_db{'}'}/documents {'{'}</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;match /{'{'}document=**{'}'} {'{'}</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;{'}'}</p>
              <p>&nbsp;&nbsp;{'}'}</p>
              <p>{'}'}</p>
            </div>
          </Step>

          <Step num={5} title="개발 서버 재시작">
            <code className="bg-[#111827] px-1.5 py-0.5 rounded">npm run dev</code>를 다시 실행하면 앱이 정상 작동합니다.
          </Step>
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-[#4f6ef7] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <p className="font-semibold text-white mb-1">{title}</p>
        <div className="text-slate-400 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
