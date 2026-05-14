import { NavLink } from 'react-router-dom';
import { Activity, ClipboardList, Stethoscope, Users, UserCircle, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { permissions } from '../utils/permissions';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const homePath = role === 'patient' ? '/' : '/dashboard';
  const items = [
    { to: '/', label: t('nav.profile'), icon: UserCircle, show: ['patient', 'doctor'].includes(role) },
    { to: '/doctors', label: t('nav.doctors'), icon: Stethoscope, show: permissions.canViewDoctors(role) },
    { to: '/patients', label: t('nav.patients'), icon: UserRound, show: permissions.canViewPatients(role) },
    { to: '/diagnoses', label: t('nav.diagnoses'), icon: ClipboardList, show: permissions.canViewDiagnoses(role) },
    { to: '/users', label: t('nav.users'), icon: Users, show: permissions.canManageUsers(role) }
  ].filter((item) => item.show);

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-3 left-3 z-40 w-64 transform rounded-[1.75rem] bg-gradient-to-b from-primary-700 via-cyan-950 to-slate-950 text-white shadow-soft transition lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:self-start lg:inset-auto lg:w-40 lg:translate-x-0 ${
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
