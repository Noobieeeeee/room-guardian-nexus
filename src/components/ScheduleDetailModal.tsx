
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Schedule, User } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Clock, CalendarIcon, User as UserIcon, MapPin, Trash2 } from 'lucide-react';
import { deleteSchedule } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/dateUtils';

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  currentUser: User;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  isOpen,
  onClose,
  schedule,
  currentUser
}) => {
  const canDelete = currentUser.role === 'admin' ||
    (currentUser.role === 'faculty' && schedule.userId === currentUser.id);

  const handleDelete = async () => {
    try {
      // Fix the type error by ensuring we pass a number
      await deleteSchedule(Number(schedule.id));
      toast.success('Schedule deleted successfully');
      onClose();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {schedule.title || `Room Booking #${schedule.roomId}`}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Instructor:</span>
            <span>{schedule.userName}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Room:</span>
            <span>{`Room ${schedule.roomId}`}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Date:</span>
            <span>{formatDate(schedule.date)}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Time:</span>
            <span>{`${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`}</span>
          </div>

          {schedule.description && (
            <div className="mt-4">
              <h4 className="font-medium mb-1 text-sm text-gray-700">Description:</h4>
              <p className="text-sm text-gray-600">{schedule.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button onClick={onClose} variant="outline">Close</Button>

          {canDelete && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Schedule
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailModal;
