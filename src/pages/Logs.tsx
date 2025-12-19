
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityLog, User } from '@/lib/types';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from '@/components/AppSidebar';
import { getActivityLogs, getRooms } from '@/lib/api';
import { toast } from 'sonner';
import { RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rooms, setRooms] = useState<{id: number, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(true);
  const navigate = useNavigate();

  // Create a reusable function to fetch logs data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [logsData, roomsData] = await Promise.all([
        getActivityLogs(),
        getRooms()
      ]);

      setLogs(logsData);
      setFilteredLogs(logsData);
      setRooms(roomsData.map(room => ({ id: room.id, name: room.name })));
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching logs data:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Function to manually refresh the logs
  const handleRefresh = () => {
    fetchData();
  };

  useEffect(() => {
    // Check for logged in user and verify they're an admin
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/dashboard');
        return;
      }
      setCurrentUser(user);
    } else {
      navigate('/');
      return;
    }

    // Initial data fetch
    fetchData();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    // Clean up the interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [navigate, fetchData]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <div>Redirecting...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser.role} />

          <main className="w-full px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Activity Logs</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  View room usage history and event logs
                </p>
              </div>

              {/* Quick filter toggle for mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="mt-2 sm:hidden flex items-center gap-1"
              >
                <Filter className="h-4 w-4 mr-1" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            <Card>
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
                  {/* Show filter badge if any filters are active */}
                  {(roomFilter !== 'all' || dateFrom || dateTo || statusFilter !== 'all') && (
                    <div className="bg-guardian-yellow text-guardian-purple text-xs font-medium px-2 py-1 rounded-full">
                      Active
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1"
                >
                  {showFilters ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Hide Filters</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Show Filters</span>
                    </>
                  )}
                </Button>
              </CardHeader>

              {showFilters && (
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
                          {rooms.map(room => (
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
              )}
            </Card>

            <Card className="mt-4 sm:mt-6">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">Log Entries</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {format(lastRefreshed, 'h:mm:ss a')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0 py-1 sm:px-4 sm:py-4">
                <div className="rounded-md border">
                  <div className="w-full overflow-hidden">
                    <div className="max-h-[calc(100vh-350px)] min-h-[300px] overflow-y-auto">
                      <Table className="w-full table-fixed">
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="whitespace-nowrap w-[80px] sm:w-[100px]">Date</TableHead>
                            <TableHead className="whitespace-nowrap w-[70px] sm:w-[80px]">Time</TableHead>
                            <TableHead className="whitespace-nowrap w-[100px] sm:w-[120px]">Room</TableHead>
                            <TableHead className="whitespace-nowrap w-[100px] sm:w-[120px]">User</TableHead>
                            <TableHead className="whitespace-nowrap w-[90px] sm:w-[100px]">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isRefreshing && filteredLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                <div className="flex justify-center items-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-guardian-yellow"></div>
                                  <span className="ml-2">Loading logs...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap w-[80px] sm:w-[100px]">{log.date}</TableCell>
                                <TableCell className="whitespace-nowrap w-[70px] sm:w-[80px]">{log.time}</TableCell>
                                <TableCell className="whitespace-nowrap w-[100px] sm:w-[120px] truncate" title={log.roomName}>{log.roomName}</TableCell>
                                <TableCell className="whitespace-nowrap w-[100px] sm:w-[120px] truncate" title={log.userName}>{log.userName}</TableCell>
                                <TableCell className={cn("whitespace-nowrap w-[90px] sm:w-[100px]", getStatusClass(log.status))}>
                                  {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                </TableCell>
                                <TableCell className="truncate" title={log.details}>
                                  {log.details}
                                </TableCell>
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
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground text-right">
                  {filteredLogs.length > 0 && (
                    <span>Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}</span>
                  )}
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
