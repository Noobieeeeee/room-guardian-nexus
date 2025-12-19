
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import CalendarView from '@/components/CalendarView';
import WeekView from '@/components/WeekView';
import { Schedule, User } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getSchedules } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Calendar: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        navigate('/');
        return;
      }
    } else {
      // No user found, redirect to login
      navigate('/');
      return;
    }

    // Fetch schedules
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const schedulesData = await getSchedules();

        if (schedulesData && Array.isArray(schedulesData)) {
          setSchedules(schedulesData);
        } else {
          console.error('Invalid schedules data:', schedulesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling for updates
    const interval = setInterval(() => {
      getSchedules().then(updatedSchedules => {
        if (updatedSchedules && Array.isArray(updatedSchedules)) {
          setSchedules(updatedSchedules);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="mb-4">Please sign in to access the calendar.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser.role} />

          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Calendar View</h1>
              <p className="text-muted-foreground">
                View and manage all room schedules
              </p>
            </div>

            {currentUser && (
              <Tabs defaultValue="month" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="month">Month View</TabsTrigger>
                  <TabsTrigger value="week">Week View</TabsTrigger>
                </TabsList>
                <TabsContent value="month">
                  <CalendarView schedules={schedules} currentUser={currentUser} />
                </TabsContent>
                <TabsContent value="week">
                  <WeekView schedules={schedules} currentUser={currentUser} />
                </TabsContent>
              </Tabs>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Calendar;
