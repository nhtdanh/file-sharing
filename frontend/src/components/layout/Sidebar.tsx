import { NavLink } from 'react-router-dom';
import { FileText, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navItems = [
    {
      title: 'Files',
      href: '/dashboard/files',
      icon: FileText,
    },
    {
      title: 'Shared Files',
      href: '/dashboard/shared',
      icon: Share2,
    },
  ];

  return (
    <div className={cn('h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col', className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

