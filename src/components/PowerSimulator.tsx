
import React, { useState } from 'react';
import { submitPowerReading } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PowerSimulatorProps {
  rooms: { id: number; name: string }[];
}

const PowerSimulator: React.FC<PowerSimulatorProps> = ({ rooms }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [currentDraw, setCurrentDraw] = useState<number>(0);
  const [deviceId, setDeviceId] = useState<string>('simulator');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRoomId === null) {
      toast.error('Please select a room');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPowerReading(selectedRoomId, currentDraw, deviceId);
      toast.success(`Power reading submitted for room ${rooms.find(r => r.id === selectedRoomId)?.name}`);
    } catch (error) {
      toast.error('Failed to submit power reading');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Power Usage Simulator</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Room</label>
          <Select
            value={selectedRoomId?.toString() || ''}
            onValueChange={(value) => setSelectedRoomId(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Current Draw (A)</label>
          <Input 
            type="number" 
            value={currentDraw} 
            onChange={(e) => setCurrentDraw(Number(e.target.value))} 
            min="0" 
            step="0.1" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Device ID</label>
          <Input 
            value={deviceId} 
            onChange={(e) => setDeviceId(e.target.value)} 
            placeholder="simulator-1" 
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Power Reading'}
        </Button>
      </form>
    </div>
  );
};

export default PowerSimulator;
