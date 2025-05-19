import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Room, Schedule } from '@/lib/types';
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatTime } from '@/lib/dateUtils';
import { CalendarIcon, Clock, MapPin, FileText, User } from 'lucide-react';

interface ViewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  rooms: Room[];
}

const ViewScheduleModal: React.FC<ViewScheduleModalProps> = ({
  isOpen,
  onClose,
  schedule,
  rooms
}) => {
  if (!schedule) return null;

  // Find the room name
  const room = rooms.find(r => r.id === schedule.roomId);
  const roomName = room ? room.name : `Room ${schedule.roomId}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Booking Details</DialogTitle>
        </DialogHeader>
        
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h2 className="text-xl font-semibold">{schedule.title || "Untitled Booking"}</h2>
              </div>
              
              {/* Room */}
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Room</div>
                  <div className="text-muted-foreground">{roomName}</div>
                </div>
              </div>
              
              {/* Date */}
              <div className="flex items-start">
                <CalendarIcon className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Date</div>
                  <div className="text-muted-foreground">{formatDate(schedule.date)}</div>
                </div>
              </div>
              
              {/* Time */}
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Time</div>
                  <div className="text-muted-foreground">
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </div>
                </div>
              </div>
              
              {/* Booked By */}
              <div className="flex items-start">
                <User className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Booked By</div>
                  <div className="text-muted-foreground">{schedule.userName || "Unknown User"}</div>
                </div>
              </div>
              
              {/* Description */}
              {schedule.description && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Description</div>
                    <div className="text-muted-foreground whitespace-pre-wrap">{schedule.description}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewScheduleModal;
