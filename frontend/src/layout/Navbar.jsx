import { Activity, Bell, LogOut, Menu, Moon, Search, Settings } from 'lucide-react';
import Button from '../components/Button';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-20 flex min-h-24 items-center justify-between gap-4 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={20} />
        </Button>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-primary-700 text-white shadow-panel">
          <Activity size={28} />
        </div>
        <div>
          <p className="text-sm font-black uppercase text-primary-600">{t('nav.dashboardLabel')}</p>
          <p className="text-3xl font-black leading-none text-slate-950">{t('nav.mainMenu')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{t('nav.subtitle')}</p>
        </div>
      </div>
      <div className="hidden items-center gap-3 xl:flex">
        <div className="rounded-[1.5rem] border border-white/70 bg-white/45 px-8 py-4 text-center shadow-sm">
          <p className="text-xs font-black uppercase text-primary-600">{t('nav.liveTime')}</p>
          <p className="mt-1 text-xl font-black text-slate-950">{new Date().toISOString().slice(0, 19).replace('T', ' ')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {[Search, Bell, Settings, Moon].map((Icon, index) => (
          <button key={index} className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm transition hover:bg-white md:flex">
            <Icon size={20} />
          </button>
        ))}
        <LanguageSwitcher compact />
        <div className="hidden items-center gap-3 rounded-2xl bg-white/70 px-4 py-2 shadow-sm sm:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 text-sm font-black text-white">
            {user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">{user?.name}</p>
            <p className="text-xs font-extrabold uppercase text-slate-500">{user?.role}</p>
          </div>
        </div>
        <Button variant="secondary" className="h-12 w-12 px-0" onClick={logout} aria-label="Logout">
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
