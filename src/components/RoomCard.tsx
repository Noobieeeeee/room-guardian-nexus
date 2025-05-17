import React from 'react';
import { UserRole, Room, Schedule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface RoomCardProps {
  room: Room;
  schedules: Schedule[];
  onAddSchedule: (roomId: number) => void;
  userRole: UserRole;
  dashboardView?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({ 
  room, 
  schedules, 
  onAddSchedule, 
  userRole,
  dashboardView = false
}) => {
  const roomSchedules = schedules.filter(schedule => schedule.roomId === room.id);
  const currentSchedule = roomSchedules.length > 0 ? roomSchedules[0] : null;
  const now = new Date();
  
  // Check if the current time falls within any scheduled time for this room
  const isCurrentlyScheduled = roomSchedules.some(schedule => {
    if (!schedule.date || !schedule.startTime || !schedule.endTime) return false;
    
    const scheduleDate = schedule.date;
    const startDateTime = parseISO(`${scheduleDate}T${schedule.startTime}`);
    const endDateTime = parseISO(`${scheduleDate}T${schedule.endTime}`);
    
    return isWithinInterval(now, { start: startDateTime, end: endDateTime });
  });
  
  // Status logic for dashboard view based on power draw and schedule
  let statusColor = 'status-available'; // Default green
  let statusText = 'Available';
  
  if (dashboardView) {
    const hasCurrentDraw = room.currentDraw && room.currentDraw > 0;
    
    if (hasCurrentDraw) {
      if (isCurrentlyScheduled) {
        // Room is drawing power during scheduled time (blue)
        statusColor = 'status-in-use'; 
        statusText = 'In Use (Scheduled)';
      } else {
        // Room is drawing power outside scheduled time (red)
        statusColor = 'status-reserved';
        statusText = 'Unscheduled Use';
      }
    } else {
      // No power draw (green)
      statusColor = 'status-available';
      statusText = 'No Activity';
    }
  } else {
    // Original status logic for non-dashboard view
    switch(room.status) {
      case 'available': 
        statusColor = 'status-available'; 
        statusText = 'Available';
        break;
      case 'in-use': 
        statusColor = 'status-in-use';
        statusText = 'In Use';
        break;
      case 'reserved': 
        statusColor = 'status-reserved';
        statusText = 'Reserved';
        break;
      default: 
        statusColor = 'bg-gray-400';
        statusText = 'Unknown';
    }
  }

  const getStatusBg = (statusColor: string) => {
    switch(statusColor) {
      case 'status-available': return 'bg-guardian-green/10 border-guardian-green/30';
      case 'status-in-use': return 'bg-guardian-blue/10 border-guardian-blue/30';
      case 'status-reserved': return 'bg-guardian-red/10 border-guardian-red/30';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const lastUpdated = new Date(room.lastUpdated);
  const formattedTime = format(lastUpdated, 'h:mm a');

  return (
    <Card className={cn("h-full overflow-hidden border-2 transition-all duration-300 guardian-card-shadow flex flex-col", 
      getStatusBg(statusColor)
    )}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{room.name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{statusText}</span>
            <div className={cn("status-indicator animate-pulse-subtle", statusColor)}></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="text-sm text-muted-foreground mb-4">
          <p className="flex justify-between">
            <span>Current draw:</span>
            <span className="font-medium">{room.currentDraw !== null ? `${room.currentDraw} A` : 'No data'}</span>
          </p>
          <p className="flex justify-between mt-1">
            <span>Last updated:</span>
            <span>{formattedTime}</span>
          </p>
        </div>

        <div className="flex-1">
          {currentSchedule ? (
            <div className="bg-secondary/10 p-3 rounded-md mb-4">
              <p className="font-medium text-sm">{currentSchedule.title || `Room Booking`}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentSchedule.startTime} - {currentSchedule.endTime}
              </p>
              <p className="text-xs mt-1">By {currentSchedule.userName}</p>
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-md mb-4">
              <p className="text-sm text-muted-foreground">No current schedule</p>
            </div>
          )}
        </div>

        {!dashboardView && userRole !== 'guest' && (
          <div className="mt-auto">
            <Button 
              className="w-full bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple" 
              onClick={() => onAddSchedule(room.id)}
            >
              Book Room
            </Button>
          </div>
        )}
        
        {dashboardView && (
          <div className="mt-auto text-center">
            <p className="text-xs text-muted-foreground">
              {isCurrentlyScheduled 
                ? "Room is currently scheduled" 
                : "No active schedule"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
