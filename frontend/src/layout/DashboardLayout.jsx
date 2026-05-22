import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Footer from './Footer';

const DashboardLayout = () => {
  return (
    <div className="app-bg min-h-screen overflow-x-hidden p-3 lg:h-[100dvh] lg:overflow-hidden lg:p-8">
      <div className="hidden lg:block">
        <Sidebar open={false} onClose={() => {}} />
      </div>
      <div id="dashboard-scroll-shell" className="glass-panel flex min-w-0 flex-col rounded-[2rem] backdrop-blur-xl lg:ml-[13.5rem] lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto">
        <Navbar />
        <TopNav />
        <main className="mx-auto w-full max-w-[1760px] flex-1 p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
