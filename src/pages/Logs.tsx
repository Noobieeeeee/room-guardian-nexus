import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockLogs, mockRooms, mockCurrentUser } from '@/lib/mockData';
import { ActivityLog, User } from '@/lib/types';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from '@/components/AppSidebar';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(mockLogs);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(mockLogs);
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, fetch logs from API
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setCurrentUser(user);
    } else {
      navigate('/');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Apply filters
    let filtered = logs;
    
    if (roomFilter !== 'all') {
      filtered = filtered.filter(log => log.roomId === parseInt(roomFilter));
    }
    
    if (dateFrom) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= dateFrom;
      });
    }
    
    if (dateTo) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date);
        return logDate <= dateTo;
      });
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }
    
    setFilteredLogs(filtered);
  }, [logs, roomFilter, dateFrom, dateTo, statusFilter]);

  const handleResetFilters = () => {
    setRoomFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatusFilter('all');
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'available': return 'text-guardian-green';
      case 'in-use': return 'text-guardian-blue';
      case 'reserved': return 'text-guardian-red';
      default: return '';
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset>
          <Navigation userRole={currentUser.role} />
          
          <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold">Activity Logs</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                View room usage history and event logs
              </p>
            </div>
            
            <Card>
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-3 sm:px-6 sm:py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomFilter">Room</Label>
                    <Select value={roomFilter} onValueChange={setRoomFilter}>
                      <SelectTrigger id="roomFilter">
                        <SelectValue placeholder="All Rooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {mockRooms.map(room => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          {dateFrom ? format(dateFrom, "PP") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          {dateTo ? format(dateTo, "PPP") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="statusFilter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in-use">In Use</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button variant="outline" onClick={handleResetFilters} className="mt-2 sm:mt-0">
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
            
            <Card className="mt-4 sm:mt-6">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-lg sm:text-xl">Log Entries</CardTitle>
              </CardHeader>
              <CardContent className="px-1 py-1 sm:px-4 sm:py-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Time</TableHead>
                        <TableHead className="whitespace-nowrap">Room</TableHead>
                        <TableHead className="whitespace-nowrap">User</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">{log.date}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.time}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.roomName}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.userName}</TableCell>
                            <TableCell className={cn("whitespace-nowrap", getStatusClass(log.status))}>
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                            </TableCell>
                            <TableCell className="max-w-[200px] sm:max-w-none truncate">{log.details}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No log entries found with the selected filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Logs;
