
import React from 'react';
import { Room, Schedule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RoomCardProps {
  room: Room;
  schedules: Schedule[];
  onAddSchedule: (roomId: number) => void;
  userRole: 'admin' | 'faculty' | 'guest';
}

const RoomCard: React.FC<RoomCardProps> = ({ room, schedules, onAddSchedule, userRole }) => {
  const roomSchedules = schedules.filter(schedule => schedule.roomId === room.id);
  const currentSchedule = roomSchedules.length > 0 ? roomSchedules[0] : null;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'available': return 'status-available';
      case 'in-use': return 'status-in-use';
      case 'reserved': return 'status-reserved';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'available': return 'Available';
      case 'in-use': return 'In Use';
      case 'reserved': return 'Reserved';
      default: return 'Unknown';
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'available': return 'bg-guardian-green/10 border-guardian-green/30';
      case 'in-use': return 'bg-guardian-blue/10 border-guardian-blue/30';
      case 'reserved': return 'bg-guardian-red/10 border-guardian-red/30';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const lastUpdated = new Date(room.lastUpdated);
  const formattedTime = format(lastUpdated, 'h:mm a');

  return (
    <Card className={cn("h-full overflow-hidden border-2 transition-all duration-300 guardian-card-shadow flex flex-col", 
      getStatusBg(room.status)
    )}>
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{room.name}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{getStatusText(room.status)}</span>
            <div className={cn("status-indicator animate-pulse-subtle", getStatusColor(room.status))}></div>
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
              <p className="font-medium text-sm">{currentSchedule.title}</p>
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

        {userRole !== 'guest' && (
          <div className="mt-auto">
            <Button 
              className="w-full bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple" 
              onClick={() => onAddSchedule(room.id)}
            >
              Book Room
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomCard;
