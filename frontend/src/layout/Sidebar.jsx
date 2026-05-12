import { NavLink } from 'react-router-dom';
import { Activity, ClipboardList, LayoutDashboard, Stethoscope, Users, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { permissions } from '../utils/permissions';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;
  const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope, show: permissions.canViewDoctors(role) },
    { to: '/patients', label: 'Patients', icon: UserRound, show: permissions.canViewPatients(role) },
    { to: '/diagnoses', label: 'Diagnoses', icon: ClipboardList, show: permissions.canViewDiagnoses(role) },
    { to: '/users', label: 'Users', icon: Users, show: permissions.canManageUsers(role) }
  ].filter((item) => item.show);

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-slate-900/30 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-slate-950 text-white shadow-xl transition lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500 text-white">
            <Activity size={22} />
          </div>
          <div>
            <p className="font-bold text-white">CareTrack</p>
            <p className="text-xs text-slate-400">Clinic MRMS</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
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
