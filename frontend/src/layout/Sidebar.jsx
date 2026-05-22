import { NavLink } from 'react-router-dom';
import { Activity, Bell, ClipboardList, FilePlus2, LayoutGrid, LifeBuoy, Moon, Share2, Stethoscope, Sun, Users, UserCircle, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { permissions } from '../utils/permissions';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const role = user?.role;
  const homePath = role === 'patient' ? '/' : '/dashboard';
  const items = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutGrid, show: role && role !== 'patient' },
    { to: '/', label: t('nav.profile'), icon: UserCircle, show: Boolean(role) },
    { to: '/doctors', label: t('nav.doctors'), icon: Stethoscope, show: permissions.canViewDoctors(role) },
    { to: '/patients', label: t('nav.patients'), icon: UserRound, show: permissions.canViewPatients(role) },
    { to: '/diagnoses', label: t('nav.diagnoses'), icon: ClipboardList, show: permissions.canViewDiagnoses(role) },
    { to: '/referrals', label: t('nav.referrals'), icon: Share2, show: permissions.canViewReferrals(role) },
    { to: '/registrations', label: t('nav.registrations'), icon: FilePlus2, show: permissions.canViewRegistrations(role) },
    { to: '/emergencies', label: t('nav.emergencies'), icon: LifeBuoy, show: permissions.canViewEmergencies(role) },
    { to: '/users', label: t('nav.users'), icon: Users, show: permissions.canManageUsers(role) }
  ].filter((item) => item.show);

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-3 left-3 z-40 w-[min(17rem,calc(100vw-1.5rem))] transform overflow-hidden rounded-[1.75rem] bg-primary-600 text-white shadow-soft transition dark:bg-slate-950 lg:fixed lg:left-8 lg:top-8 lg:h-[calc(100dvh-4rem)] lg:w-48 lg:translate-x-0 lg:overflow-y-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavLink to={homePath} onClick={onClose} className="flex flex-col items-center gap-3 bg-primary-700/35 px-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-sky-100 bg-white text-primary-700 shadow-panel">
            <Activity size={25} />
          </div>
          <div>
            <p className="text-base font-black leading-tight text-white">{user?.name || 'CareTrack'}</p>
            <p className="mt-1 max-w-[9rem] truncate text-xs font-semibold text-sky-100">{user?.email || 'Clinic Hub'}</p>
          </div>
        </NavLink>
        <nav className="space-y-2 p-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold ${
                  isActive ? 'bg-white text-primary-700 shadow-panel' : 'text-sky-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-4 pb-5">
          <div className="rounded-full bg-primary-700/55 p-1 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
                  theme === 'light' ? 'bg-white/20 text-white shadow-sm' : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                <Sun size={14} /> Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition ${
                  theme === 'dark' ? 'bg-white/20 text-white shadow-sm' : 'text-sky-100 hover:bg-white/10'
                }`}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-sky-100">
            <Bell size={14} /> CareTrack
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
