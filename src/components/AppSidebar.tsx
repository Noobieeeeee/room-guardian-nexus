
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, Activity, LogOut } from 'lucide-react';

interface AppSidebarProps {
  userRole: UserRole;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ userRole }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'faculty', 'guest'] as UserRole[] 
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

  const handleLogout = () => {
    // In a real app, implement logout logic here
    window.location.href = '/';
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-4">
          <div className="text-guardian-yellow font-bold text-2xl">RoomGuardian</div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
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
                    <link.icon />
                    <span>{link.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
