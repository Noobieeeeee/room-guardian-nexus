
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Schedule, User } from '@/lib/types';
import ScheduleDetailModal from '@/components/ScheduleDetailModal';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

interface CalendarViewProps {
  schedules: Schedule[];
  currentUser: User;
}

const CalendarView: React.FC<CalendarViewProps> = ({ schedules, currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Calculate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Day headers
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigation functions
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Handle schedule click
  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailModalOpen(true);
  };
  
  // Get schedules for a specific day
  const getDaySchedules = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return schedules.filter(schedule => schedule.date === dayStr);
  };
  
  // Get calendar rows
  const getCalendarRows = () => {
    // Create a blank grid to fill with days
    let calendarGrid = [];
    let startDay = getDay(startDate);
    
    // Create first row with empty cells for days before the month starts
    let row = [];
    for (let i = 0; i < startDay; i++) {
      row.push(null);
    }
    
    // Fill in the days of the month
    for (let day of days) {
      row.push(day);
      
      // Start a new row after Saturday
      if (row.length === 7) {
        calendarGrid.push(row);
        row = [];
      }
    }
    
    // Fill in empty cells at the end if needed
    if (row.length > 0) {
      while (row.length < 7) {
        row.push(null);
      }
      calendarGrid.push(row);
    }
    
    return calendarGrid;
  };
  
  const calendarRows = getCalendarRows();

  // Check if a schedule is in progress
  const isScheduleInProgress = (schedule: Schedule) => {
    if (!schedule.date || !schedule.startTime || !schedule.endTime) return false;
    
    const now = new Date();
    const scheduleDate = schedule.date;
    const startDateTime = parseISO(`${scheduleDate}T${schedule.startTime}`);
    const endDateTime = parseISO(`${scheduleDate}T${schedule.endTime}`);
    
    return now >= startDateTime && now <= endDateTime;
  };
  
  // Get event class based on schedule status and user role
  const getEventClass = (schedule: Schedule) => {
    const inProgress = isScheduleInProgress(schedule);
    const baseClass = "calendar-event";
    
    if (schedule.userId === currentUser?.id) {
      return `${baseClass} event-faculty ${inProgress ? "ring-2 ring-blue-400" : ""}`;
    } else if (currentUser?.role === 'admin') {
      return `${baseClass} event-admin ${inProgress ? "ring-2 ring-blue-400" : ""}`;
    } else {
      return `${baseClass} event-guest ${inProgress ? "ring-2 ring-blue-400" : ""}`;
    }
  };

  return (
    <div className="calendar-container border rounded-lg shadow-sm">
      <div className="calendar-header bg-white p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold">
          {format(currentDate, dateFormat)}
        </h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="bg-white">
        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {weekdays.map(day => (
            <div key={day} className="py-2 border-b text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid divide-y">
          {calendarRows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid grid-cols-7 divide-x min-h-[120px]">
              {row.map((day, dayIndex) => (
                <div 
                  key={`cell-${rowIndex}-${dayIndex}`} 
                  className={cn(
                    "p-1 relative",
                    day ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {day && (
                    <>
                      <div className={cn(
                        "text-sm font-medium mb-1 p-1 rounded-full w-7 h-7 flex items-center justify-center",
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                          ? "bg-guardian-purple text-white" 
                          : "text-gray-700"
                      )}>
                        {format(day, "d")}
                      </div>
                      
                      <div className="space-y-1 max-h-[80px] overflow-y-auto">
                        {getDaySchedules(day).map((schedule) => (
                          <div 
                            key={schedule.id}
                            onClick={() => handleScheduleClick(schedule)}
                            className={getEventClass(schedule)}
                            title={`${schedule.title || `Room ${schedule.roomId}`} (${schedule.startTime} - ${schedule.endTime})`}
                          >
                            {schedule.title || `Room ${schedule.roomId}`}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {selectedSchedule && (
        <ScheduleDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          schedule={selectedSchedule}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default CalendarView;
