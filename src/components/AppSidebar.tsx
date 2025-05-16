
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
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, Activity, LogOut } from 'lucide-react';
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

  const handleLogout = async () => {
    const success = await signOut();
    if (success) {
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center p-4">
          <div className={cn(
            "text-guardian-yellow font-bold text-2xl transition-opacity duration-200",
            state === "collapsed" ? "opacity-0" : "opacity-100"
          )}>RoomGuardian</div>
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
