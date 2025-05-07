
import React from 'react';
import { UserRole } from '@/lib/types';
import { SidebarTrigger } from "@/components/ui/sidebar";

interface NavigationProps {
  userRole: UserRole;
}

const Navigation: React.FC<NavigationProps> = () => {
  return (
    <div className="flex items-center h-16 px-4 border-b bg-guardian-purple text-white">
      <SidebarTrigger />
    </div>
  );
};

export default Navigation;
