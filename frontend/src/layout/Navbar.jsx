import { Activity, ClipboardList, LogOut, Stethoscope, UserCircle, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { permissions, roleLabel } from '../utils/permissions';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const role = user?.role;
  const homePath = role === 'patient' ? '/' : '/dashboard';
  const quickActions = [
    { to: '/', label: t('nav.profile'), icon: UserCircle, show: ['patient', 'doctor'].includes(role) },
    { to: '/doctors', label: t('nav.doctors'), icon: Stethoscope, show: permissions.canViewDoctors(role) },
    { to: '/patients', label: t('nav.patients'), icon: UserRound, show: permissions.canViewPatients(role) },
    { to: '/diagnoses', label: t('nav.diagnoses'), icon: ClipboardList, show: permissions.canViewDiagnoses(role) },
    { to: '/users', label: t('nav.users'), icon: Users, show: permissions.canManageUsers(role) }
  ].filter((item) => item.show).slice(0, 4);
  const heading = role === 'patient'
    ? { label: t('nav.profile'), title: t('nav.profile'), subtitle: t('profile.subtitle') }
    : { label: t('nav.dashboardLabel'), title: t('nav.mainMenu'), subtitle: t('nav.subtitle') };

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 rounded-[1.45rem] bg-white/88 px-4 py-3 shadow-sm backdrop-blur lg:mx-1 lg:mt-1 lg:px-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(homePath)} className="flex items-center gap-3 text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-panel">
            <Activity size={23} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-2xl font-black leading-none text-slate-950">{heading.title}</p>
            <p className="mt-1 hidden text-xs font-semibold text-slate-400 sm:block">{heading.subtitle}</p>
          </div>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {quickActions.map(({ to, label, icon: Icon }) => (
          <button
            key={to}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => navigate(to)}
            className="hidden h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-primary-700 shadow-sm transition hover:bg-white md:flex"
          >
            <Icon size={20} />
          </button>
        ))}
        <LanguageSwitcher compact />
        <button type="button" onClick={() => navigate(homePath)} className="hidden items-center gap-3 rounded-full bg-sky-50 px-3 py-2 text-left shadow-sm transition hover:bg-white sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-xs font-black text-white">
            {user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">{user?.name}</p>
            <p className="text-xs font-extrabold uppercase text-slate-500">{t(`roles.${user?.role}`, roleLabel(user?.role))}</p>
          </div>
        </button>
        <Button variant="secondary" className="h-11 w-11 px-0" onClick={logout} aria-label={t('common.logout')}>
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
