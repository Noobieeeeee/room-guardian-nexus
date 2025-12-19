import React, { useState, useEffect } from 'react';
import { Room, RoomStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Omit<Room, 'id' | 'lastUpdated'>) => void;
  room?: Room | null;
}

const RoomFormModal: React.FC<RoomFormModalProps> = ({ isOpen, onClose, onSave, room }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<RoomStatus>('available');
  const [currentDraw, setCurrentDraw] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setName(room.name);
      setStatus(room.status);
      setCurrentDraw(room.currentDraw?.toString() || '');
    } else {
      setName('');
      setStatus('available');
      setCurrentDraw('');
    }
  }, [room, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const roomData = {
        name,
        status,
        currentDraw: currentDraw ? parseFloat(currentDraw) : null
      };

      await onSave(roomData);
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{room ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            <DialogDescription>
              {room 
                ? 'Edit the room details below.' 
                : 'Enter the details for the new room.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Room Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select value={status} onValueChange={(value) => setStatus(value as RoomStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentDraw" className="text-right">
                Current Draw (A)
              </Label>
              <div className="col-span-3">
                <Input
                  id="currentDraw"
                  type="number"
                  step="0.01"
                  value={currentDraw}
                  onChange={(e) => setCurrentDraw(e.target.value)}
                  className="w-full"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (room ? 'Update Room' : 'Add Room')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomFormModal;