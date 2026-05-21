import { NavLink } from 'react-router-dom';
import { Activity, ClipboardList, FilePlus2, LifeBuoy, Share2, Stethoscope, Users, UserCircle, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { permissions } from '../utils/permissions';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const homePath = role === 'patient' ? '/' : '/dashboard';
  const items = [
    { to: '/', label: t('nav.profile'), icon: UserCircle, show: Boolean(role) },
    { to: '/doctors', label: t('nav.doctors'), icon: Stethoscope, show: permissions.canViewDoctors(role) },
    { to: '/patients', label: t('nav.patients'), icon: UserRound, show: permissions.canViewPatients(role) },
    { to: '/diagnoses', label: t('nav.diagnoses'), icon: ClipboardList, show: permissions.canViewDiagnoses(role) },
    { to: '/referrals', label: t('nav.referrals', 'Yo‘llanmalar'), icon: Share2, show: permissions.canViewReferrals(role) },
    { to: '/registrations', label: t('nav.registrations', 'Ro‘yxatga olish'), icon: FilePlus2, show: permissions.canViewRegistrations(role) },
    { to: '/emergencies', label: t('nav.emergencies', 'Favqulodda'), icon: LifeBuoy, show: permissions.canViewEmergencies(role) },
    { to: '/users', label: t('nav.users'), icon: Users, show: permissions.canManageUsers(role) }
  ].filter((item) => item.show);

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-3 left-3 z-40 w-[min(16rem,calc(100vw-1.5rem))] transform rounded-[1.75rem] bg-gradient-to-b from-primary-700 via-cyan-950 to-slate-950 text-white shadow-soft transition lg:fixed lg:left-6 lg:top-0 lg:h-screen lg:w-40 lg:translate-x-0 lg:overflow-y-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavLink to={homePath} onClick={onClose} className="flex flex-col items-center gap-4 px-5 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/95 text-primary-700 shadow-panel">
            <Activity size={26} />
          </div>
          <div>
            <p className="text-sm font-black uppercase leading-tight text-white">CareTrack</p>
            <p className="text-xs font-bold uppercase text-cyan-100">Clinic Hub</p>
          </div>
        </NavLink>
        <nav className="space-y-4 p-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold lg:flex-col lg:justify-center lg:gap-2 lg:px-2 ${
                  isActive ? 'bg-white text-primary-700 shadow-panel' : 'text-cyan-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
