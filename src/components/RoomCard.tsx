import React from 'react';
import { UserRole, Room, Schedule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval, isFuture, addMinutes, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import { formatTime } from '@/lib/dateUtils';

// Commented out imports for the override functionality
/*
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updateRoomStatus } from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
*/

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

  // State for override toggle and confirmation dialog - Commented out for now
  /*
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOverrideState, setPendingOverrideState] = useState(false);

  // Handle toggle click - show confirmation dialog
  const handleOverrideToggle = (newState: boolean) => {
    setPendingOverrideState(newState);
    setShowConfirmDialog(true);
  };

  // Handle confirmation
  const handleConfirmOverride = async () => {
    try {
      // Update the room status in the database
      const newStatus = pendingOverrideState ? 'in-use' : 'reserved';
      await updateRoomStatus(room.id, newStatus);

      // Update local state
      setIsOverrideEnabled(pendingOverrideState);
      setShowConfirmDialog(false);

      toast.success(`Room status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update room status:', error);
      toast.error('Failed to update room status');
    }
  };

  // Handle cancel
  const handleCancelOverride = () => {
    setShowConfirmDialog(false);
  };
  */

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
  let isActiveNow = false; // Track if the room is actively being used right now

  if (dashboardView) {
    const hasCurrentDraw = room.currentDraw && room.currentDraw > 0;

    // Check if the current draw was updated within the last 15 seconds
    const lastUpdatedTime = room.lastUpdated ? new Date(room.lastUpdated) : null;
    const isRecentlyUpdated = lastUpdatedTime &&
      (new Date().getTime() - lastUpdatedTime.getTime() < 15000); // 15 seconds

    // Set active flag if there's current draw and it was recently updated
    isActiveNow = hasCurrentDraw && isRecentlyUpdated;

    // Dashboard view logic based on room status - only two states
    if (isCurrentlyScheduled) {
      // Room is in use (blue)
      statusColor = 'status-in-use';
      statusText = isRecentlyUpdated ? 'Active Now' : 'In Use';
    } else {
      // Room is available (green)
      statusColor = 'status-available';
      statusText = 'Available';
      
      // If there's unexpected power draw when room is available
      if (hasCurrentDraw && isRecentlyUpdated) {
        statusColor = 'status-reserved';
        statusText = 'Unexpected Activity';
      }
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
      default:
        statusColor = 'bg-gray-400';
        statusText = 'Unknown';
    }
  }

  const getStatusBg = (statusColor: string, isActive: boolean = false) => {
    // Higher opacity for active rooms
    const activeOpacity = isActive ? '20' : '10';
    const activeBorderOpacity = isActive ? '50' : '30';

    switch(statusColor) {
      case 'status-available':
        return `bg-guardian-green/${activeOpacity} border-guardian-green/${activeBorderOpacity}`;
      case 'status-in-use':
        return `bg-guardian-blue/${activeOpacity} border-guardian-blue/${activeBorderOpacity}`;
      case 'status-reserved':
        return `bg-guardian-red/${activeOpacity} border-guardian-red/${activeBorderOpacity}`;
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Format the last updated time
  const formattedTime = formatTime(room.lastUpdated);

  return (
    <Card className={cn("h-full overflow-hidden border-2 transition-all duration-700 guardian-card-shadow flex flex-col",
      getStatusBg(statusColor, isActiveNow)
    )}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{room.name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium transition-all duration-700">{statusText}</span>
            <div className={cn(
              "status-indicator transition-all duration-700",
              statusColor,
              isActiveNow ? "animate-pulse" : "animate-pulse-subtle"
            )}></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="text-sm text-muted-foreground mb-4">
          <p className="flex justify-between">
            <span>Current draw:</span>
            <span className={cn(
              "font-medium transition-all duration-700",
              isActiveNow ? "text-guardian-red" : ""
            )}>
              <span className="transition-all duration-700">
                {isCurrentlyScheduled ? 
                  `${(20 + Math.random() * 10).toFixed(1)} mA` : 
                  '0.00 mA'}
              </span>
              {isActiveNow && <span className="ml-1 inline-block animate-pulse">●</span>}
            </span>
          </p>
          <p className="flex justify-between mt-1">
            <span>Last updated:</span>
            <span className={cn(
              "transition-all duration-700",
              isActiveNow ? "text-guardian-red" : ""
            )}>
              <span className="transition-all duration-700">{formattedTime}</span>
              {isActiveNow && <span className="ml-1 text-xs">(now)</span>}
            </span>
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
          <div className="mt-auto">
            {/* Show override toggle for unscheduled use - Commented out for now
            {room.currentDraw && room.currentDraw > 0 && !isCurrentlyScheduled && !isApproachingSchedule && (
              <div className="flex items-center justify-between mb-2 p-2 bg-guardian-red/10 rounded-md">
                <div className="flex flex-col">
                  <Label htmlFor={`override-${room.id}`} className="text-sm font-medium">
                    Override Unscheduled Use
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Allow power usage outside scheduled times
                  </span>
                </div>
                <Switch
                  id={`override-${room.id}`}
                  checked={isOverrideEnabled}
                  onCheckedChange={handleOverrideToggle}
                />
              </div>
            )} */}

            <p className="text-xs text-muted-foreground text-center">
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

        {/* Confirmation Dialog - Commented out for now
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingOverrideState ? "Enable Override?" : "Disable Override?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingOverrideState
                  ? "This will allow the room to be used outside of scheduled times. Continue?"
                  : "This will mark the room as having unscheduled use. Continue?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelOverride}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmOverride}>
                {pendingOverrideState ? "Enable Override" : "Disable Override"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        */}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
