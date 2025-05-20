import React from 'react';
import { UserRole, Room, Schedule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval, isFuture, addMinutes, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import { formatTime } from '@/lib/dateUtils';

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
  const now = new Date();

  // Find the next nearest schedule
  const getNextNearestSchedule = (): Schedule | null => {
    if (roomSchedules.length === 0) return null;

    // Convert schedules to date objects for comparison
    const schedulesWithDates = roomSchedules.map(schedule => {
      const startDateTime = parseISO(`${schedule.date}T${schedule.startTime}`);
      const endDateTime = parseISO(`${schedule.date}T${schedule.endTime}`);
      return { ...schedule, startDateTime, endDateTime };
    });

    // First check if there's a currently active schedule
    const currentActiveSchedule = schedulesWithDates.find(schedule =>
      isWithinInterval(now, { start: schedule.startDateTime, end: schedule.endDateTime })
    );

    if (currentActiveSchedule) return currentActiveSchedule;

    // If no active schedule, find the next upcoming one
    const futureSchedules = schedulesWithDates
      .filter(schedule => isAfter(schedule.startDateTime, now))
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    return futureSchedules.length > 0 ? futureSchedules[0] : null;
  };

  const nextSchedule = getNextNearestSchedule();

  // Check if the current time falls within any scheduled time for this room
  const isCurrentlyScheduled = roomSchedules.some(schedule => {
    if (!schedule.date || !schedule.startTime || !schedule.endTime) return false;

    const scheduleDate = schedule.date;
    const startDateTime = parseISO(`${scheduleDate}T${schedule.startTime}`);
    const endDateTime = parseISO(`${scheduleDate}T${schedule.endTime}`);

    return isWithinInterval(now, { start: startDateTime, end: endDateTime });
  });

  // Check if we're approaching the next schedule (within 15 minutes)
  const isApproachingSchedule = nextSchedule ? (() => {
    const startDateTime = parseISO(`${nextSchedule.date}T${nextSchedule.startTime}`);
    const minutesUntilStart = differenceInMinutes(startDateTime, now);
    return minutesUntilStart >= 0 && minutesUntilStart <= 15;
  })() : false;

  // Status logic for dashboard view based on power draw, schedule, and time
  let statusColor = 'status-available'; // Default green
  let statusText = 'Available';

  if (dashboardView) {
    const hasCurrentDraw = room.currentDraw && room.currentDraw > 0;

    if (isCurrentlyScheduled) {
      // Room is currently scheduled (red)
      statusColor = 'status-reserved';
      statusText = 'Currently Scheduled';

      // If there's also power draw, it's in use
      if (hasCurrentDraw) {
        statusColor = 'status-in-use';
        statusText = 'In Use (Scheduled)';
      }
    } else if (isApproachingSchedule) {
      // Approaching scheduled time (red)
      statusColor = 'status-reserved';
      statusText = 'Upcoming Schedule Soon';
    } else if (hasCurrentDraw) {
      // Room is drawing power outside scheduled time (red)
      statusColor = 'status-reserved';
      statusText = 'Unscheduled Use';
    } else {
      // No power draw and no current/approaching schedule (green)
      statusColor = 'status-available';
      statusText = 'Available';
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

  // Format the last updated time
  const formattedTime = formatTime(room.lastUpdated);

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
          {nextSchedule ? (
            <div className={cn(
              "p-3 rounded-md mb-4",
              isCurrentlyScheduled || isApproachingSchedule
                ? "bg-guardian-red/10"
                : "bg-secondary/10"
            )}>
              <p className="font-medium text-sm">{nextSchedule.title || `Room Booking`}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(parseISO(`${nextSchedule.date}T00:00:00`), 'MMM d')} • {formatTime(nextSchedule.startTime)} - {formatTime(nextSchedule.endTime)}
              </p>
              <p className="text-xs mt-1">By {nextSchedule.userName}</p>
              {isCurrentlyScheduled && (
                <p className="text-xs mt-1 text-guardian-red font-medium">Currently in progress</p>
              )}
              {isApproachingSchedule && !isCurrentlyScheduled && (
                <p className="text-xs mt-1 text-guardian-red font-medium">Starting soon</p>
              )}
            </div>
          ) : (
            <div className="bg-muted/30 p-3 rounded-md mb-4">
              <p className="text-sm text-muted-foreground">No upcoming schedule</p>
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
                : isApproachingSchedule
                  ? "Schedule starting soon"
                  : nextSchedule
                    ? "Next schedule upcoming"
                    : "No upcoming schedules"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
