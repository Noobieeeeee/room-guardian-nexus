
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { User, UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, Activity, LogOut, Users, Building, CalendarDays, User as UserIcon } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
  userRole: UserRole;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['admin'] as UserRole[]
    },

    {
      path: '/calendar',
      name: 'Calendar',
      icon: CalendarDays,
      allowedRoles: ['admin', 'faculty', 'guest', 'student'] as UserRole[]
    },
    {
      path: '/rooms',
      name: 'Room Management',
      icon: Building,
      allowedRoles: ['admin', 'faculty'] as UserRole[]
    },
    {
      path: '/users',
      name: 'User Management',
      icon: Users,
      allowedRoles: ['admin'] as UserRole[]
    },
    {
      path: '/logs',
      name: 'Activity Logs',
      icon: Activity,
      allowedRoles: ['admin'] as UserRole[]
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: Settings,
      allowedRoles: ['admin', 'faculty'] as UserRole[]
    },
  ];

  const handleLogout = async () => {
    const success = await signOut();
    if (success) {
      toast.success('Logged out successfully');
      navigate('/');
    } else {
      toast.error('Failed to log out');
    }
  };

  // Map role to a display-friendly color
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-guardian-red/20 text-guardian-red border border-guardian-red/20';
      case 'faculty':
        return 'bg-guardian-blue/20 text-guardian-blue border border-guardian-blue/20';
      case 'guest':
        return 'bg-guardian-green/20 text-guardian-green border border-guardian-green/20';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center p-4">
          <div className={cn(
            "text-guardian-yellow font-bold text-2xl transition-all duration-300",
            state === "collapsed" ? "opacity-0 scale-95" : "opacity-100 scale-100"
          )}>RoomGuardian</div>
        </div>
      </SidebarHeader>

      {/* Navigation Icons - Moved to top */}
      <SidebarContent className="mt-1">
        <SidebarMenu>
          {navLinks
            .filter(link => link.allowedRoles.includes(userRole))
            .map(link => (
              <SidebarMenuItem key={link.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(link.path)}
                  tooltip={link.name}
                >
                  <Link to={link.path}>
                    <link.icon className="h-5 w-5" />
                    <span className="ml-2">{link.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator className="mt-2" />

      {/* User profile section - Moved below navigation */}
      <div className={cn(
        "px-4 py-2 mb-2 transition-all duration-300",
        state === "collapsed" ? "opacity-0" : "opacity-100"
      )}>
        {currentUser && (
          <div className="flex flex-col bg-sidebar-accent/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-sidebar-foreground/70" />
              <span className="font-medium text-sm overflow-hidden text-ellipsis">
                Logged in as:
              </span>
            </div>
            <div className="ml-6 text-sm font-bold">{currentUser.name}</div>
            <div className="ml-6">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                getRoleBadgeClass(currentUser.role)
              )}>
                {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      <SidebarFooter>
        <div className="relative">
          {state === "collapsed" ? (
            <Button
              variant="ghost"
              size="icon"
              className="flex items-center justify-center w-10 h-10 mx-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
