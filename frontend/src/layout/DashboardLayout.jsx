import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Footer from './Footer';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen overflow-x-hidden p-3 lg:h-[100dvh] lg:overflow-hidden lg:p-6">
      <div className="hidden lg:block">
        <Sidebar open={false} onClose={() => {}} />
      </div>
      <div id="dashboard-scroll-shell" className="flex min-w-0 flex-col rounded-[2rem] border border-white/60 bg-cyan-50/45 shadow-soft backdrop-blur lg:ml-[11.5rem] lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        <Navbar />
        <TopNav />
        <main className="mx-auto w-full max-w-[1760px] flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
