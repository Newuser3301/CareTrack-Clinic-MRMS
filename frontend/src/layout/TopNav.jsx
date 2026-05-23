import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutGrid, Stethoscope, UserCircle, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { permissions } from '../utils/permissions';

const itemClass = ({ isActive }) =>
  `inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-sm transition ${
    isActive
      ? 'border-white/70 bg-white text-primary-700'
      : 'border-white/60 bg-white/70 text-slate-700 hover:bg-white'
  }`;

const TopNav = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const role = user?.role;
  const canViewDashboard = ['super_admin', 'admin'].includes(role);
  const canViewProfile = Boolean(role) && !canViewDashboard;

  const items = [
    { to: '/', label: t('nav.profile'), icon: UserCircle, show: canViewProfile },
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutGrid, show: canViewDashboard },
    { to: '/doctors', label: t('nav.doctors'), icon: Stethoscope, show: permissions.canViewDoctors(role) },
    { to: '/patients', label: t('nav.patients'), icon: UserRound, show: permissions.canViewPatients(role) },
    { to: '/diagnoses', label: t('nav.diagnoses'), icon: ClipboardList, show: permissions.canViewDiagnoses(role) },
    { to: '/users', label: t('nav.users'), icon: Users, show: permissions.canManageUsers(role) }
  ].filter((item) => item.show);

  return (
    <nav className="lg:hidden">
      <div className="px-3 pb-3 pt-2">
        <div className="mx-auto w-full max-w-md rounded-full border border-white/80 bg-white/75 p-2 shadow-panel backdrop-blur">
          <div className="flex items-center justify-between gap-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={itemClass} aria-label={label} title={label}>
              <Icon size={20} />
            </NavLink>
          ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
