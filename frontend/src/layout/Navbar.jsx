import { Bell, LogOut, Menu } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
          <Menu size={20} />
        </Button>
        <div>
          <p className="text-sm font-semibold text-slate-950">Medical Records Management</p>
          <p className="text-xs text-slate-500">CareTrack Clinic operations console</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 md:flex">
          <Bell size={16} className="text-green-600" />
          System online
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
        <Button variant="secondary" onClick={logout}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
