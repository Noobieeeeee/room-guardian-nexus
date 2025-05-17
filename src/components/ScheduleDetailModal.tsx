
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Schedule, UserRole } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Clock, CalendarIcon, User, MapPin } from 'lucide-react';

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  userRole: UserRole;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  isOpen,
  onClose,
  schedule,
  userRole
}) => {
  const handleDelete = async () => {
    try {
      // Placeholder for delete functionality
      // Would be implemented through an API call
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
            <User className="h-4 w-4 text-gray-500" />
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
            <span>{format(new Date(schedule.date), 'MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Time:</span>
            <span>{`${schedule.startTime} - ${schedule.endTime}`}</span>
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
          
          {(userRole === 'admin' || (userRole === 'faculty' && schedule.userId === localStorage.getItem('userId'))) && (
            <Button 
              onClick={handleDelete} 
              variant="destructive"
            >
              Delete Schedule
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailModal;
