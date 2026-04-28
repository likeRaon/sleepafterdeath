import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '일정 입력', icon: '✏️', step: 1, desc: '못 오는 시간 등록' },
  { path: '/schedule', label: '전체 현황', icon: '📋', step: 2, desc: '멤버별 제출 확인' },
  { path: '/optimal', label: '최적 시간', icon: '✨', step: 3, desc: '레이드 시간 추천' },
  { path: '/admin', label: '관리자', icon: '⚙️', step: null, desc: '설정 및 멤버 관리' },
];

export default function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-[#1e2d4a] shadow-2xl">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              <span className="text-xl sm:text-2xl drop-shadow-lg">⚔️</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#c9a227] rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-gradient-gold font-black text-base sm:text-lg leading-tight tracking-tight">
                아이온2 일정 관리
              </h1>
              <p className="text-[10px] font-semibold tracking-widest uppercase hidden sm:block" style={{ color: '#3a5278' }}>
                Schedule Manager
              </p>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const isAdmin = item.step === null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={item.desc}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4f8ef7]/20 to-[#3a6fd4]/10 text-[#4f8ef7] border border-[#4f8ef7]/30 shadow-sm'
                      : isAdmin
                      ? 'text-[#3a5278] hover:text-slate-400 hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.step && (
                    <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black flex-shrink-0 ${
                      isActive ? 'bg-[#4f8ef7] text-white' : 'bg-[#1e2d4a] text-slate-500'
                    }`}>
                      {item.step}
                    </span>
                  )}
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#4f8ef7] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-[#1e2d4a] text-slate-400 hover:text-white transition-all"
          >
            {menuOpen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-[#1e2d4a] bg-[#070b14]/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#4f8ef7]/15 border border-[#4f8ef7]/25 text-[#4f8ef7]'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    {item.step && (
                      <span className="text-[10px] font-black text-[#4f8ef7]">STEP {item.step}</span>
                    )}
                    <span className="font-semibold text-sm">{item.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
