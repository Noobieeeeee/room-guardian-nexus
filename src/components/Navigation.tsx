
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NavigationProps {
  userRole: UserRole;
}

const Navigation: React.FC<NavigationProps> = ({ userRole }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { 
      path: '/dashboard', 
      name: 'Dashboard', 
      allowedRoles: ['admin', 'faculty', 'guest'] as UserRole[] 
    },
    { 
      path: '/logs', 
      name: 'Activity Logs', 
      allowedRoles: ['admin'] as UserRole[] 
    },
    { 
      path: '/settings', 
      name: 'Settings', 
      allowedRoles: ['admin', 'faculty'] as UserRole[]  
    },
  ];

  const handleLogout = () => {
    // In a real app, implement logout logic here
    window.location.href = '/';
  };

  return (
    <nav className="bg-guardian-purple text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="text-guardian-yellow font-bold text-2xl">RoomGuardian</div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {navLinks
            .filter(link => link.allowedRoles.includes(userRole))
            .map(link => (
              <Link 
                key={link.path}
                to={link.path}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive(link.path) 
                    ? "bg-guardian-yellow text-guardian-purple" 
                    : "text-white hover:bg-guardian-purple/80"
                )}
              >
                {link.name}
              </Link>
            ))
          }
          <Button 
            variant="ghost" 
            className="text-white hover:bg-guardian-purple/80" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
