import { Outlet } from 'react-router-dom';
import { TopNavigation } from './TopNavigation';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen">
      <TopNavigation />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar*/}
        <aside className="hidden md:block border-r-2 border-sidebar-border flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-scroll custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

