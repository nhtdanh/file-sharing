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
    <div className={cn('pb-12 w-64', className)}>
      <div className="space-y-4 py-4">
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
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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

