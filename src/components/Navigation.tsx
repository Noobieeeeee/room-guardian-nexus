
import React from 'react';
import { UserRole } from '@/lib/types';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationProps {
  userRole: UserRole;
}

const Navigation: React.FC<NavigationProps> = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center h-16 px-4 w-full border-b bg-guardian-purple text-white">
      <SidebarTrigger className={isMobile ? "mr-2" : "mr-4"} />
      {!isMobile && <h1 className="text-xl font-semibold">RoomGuardian</h1>}
    </div>
  );
};

export default Navigation;
