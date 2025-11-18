import { Outlet } from 'react-router-dom';
import { TopNavigation } from './TopNavigation';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation />
      <div className="flex flex-1">
        {/* Sidebar - ẩn trên mobile */}
        <aside className="hidden md:block border-r">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

