
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from '@/components/AppSidebar';
import { User } from '@/lib/types';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sensorThreshold, setSensorThreshold] = useState('0.5');
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, fetch user from API
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setName(user.name);
      setEmail(user.email);
    } else {
      // No user found, redirect to login
      navigate('/');
    }
  }, [navigate]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // In a real app, we would send this to an API
    const updatedUser = { ...currentUser, name, email };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    toast.success('Profile updated successfully');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // In a real app, we would send this to an API
    toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send this to an API
    toast.success('Settings updated successfully');
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser.role} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser.role} />
          
          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your account and application preferences
              </p>
            </div>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-4 overflow-x-auto flex whitespace-nowrap w-full">
                <TabsTrigger value="profile" className="px-2 md:px-4">Profile</TabsTrigger>
                <TabsTrigger value="password" className="px-2 md:px-4">Password</TabsTrigger>
                <TabsTrigger value="preferences" className="px-2 md:px-4">Preferences</TabsTrigger>
                {currentUser.role === 'admin' && (
                  <TabsTrigger value="system" className="px-2 md:px-4">System</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Input 
                            id="role" 
                            value={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} 
                            disabled 
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
                      >
                        Update Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
                      >
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="preferences">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateSettings} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications about room activities
                          </p>
                        </div>
                        <Switch 
                          id="emailNotifications"
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <Button 
                        type="submit" 
                        className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
                      >
                        Save Preferences
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {currentUser.role === 'admin' && (
                <TabsContent value="system">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateSettings} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sensorThreshold">
                            Sensor Threshold (Amperes)
                          </Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            Minimum current draw required to mark a room as "In Use"
                          </p>
                          <div className="flex items-center gap-4">
                            <Input 
                              id="sensorThreshold" 
                              type="number" 
                              value={sensorThreshold} 
                              onChange={(e) => setSensorThreshold(e.target.value)}
                              min="0.1"
                              max="5"
                              step="0.1"
                              className="w-32"
                            />
                            <span>Amperes</span>
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
                        >
                          Save System Settings
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
