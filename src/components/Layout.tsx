import { ReactNode } from 'react';
import { useAppStore } from '../store/store';

type Props = {
  children: ReactNode;
};

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'masterdata', label: 'Stammdaten' },
  { key: 'history', label: 'Historie' },
] as const;

export function Layout({ children }: Props) {
  const nav = useAppStore((s) => s.nav);
  const setNav = useAppStore((s) => s.setNav);

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <header className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">RMS Light</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setNav(item.key)}
              className={`min-h-[48px] rounded-xl px-5 py-2 text-lg font-semibold transition ${
                nav === item.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>
      {children}
    </div>
  );
}
