
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { UserRole } from '@/lib/types';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Building, Users, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationProps {
  userRole: UserRole;  // Update this to accept the UserRole type
}

const Navigation: React.FC<NavigationProps> = ({ userRole }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center h-16 px-4 w-full border-b bg-guardian-purple text-white">
      <SidebarTrigger className={isMobile ? "mr-2" : "mr-4"} />
      {!isMobile && <h1 className="text-xl font-semibold">RoomGuardian</h1>}
    </div>
  );
};

export default Navigation;
