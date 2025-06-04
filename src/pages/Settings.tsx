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
import { supabase } from '@/integrations/supabase/client';
import { signOut } from '@/lib/auth';
import { getSystemSettings, updateSystemSettings } from '@/lib/settingsService';

const Settings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sensorThreshold, setSensorThreshold] = useState('0.5');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged in user
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

    // Load system settings
    loadSystemSettings();
  }, [navigate]);

  const loadSystemSettings = async () => {
    try {
      const settings = await getSystemSettings();
      setSensorThreshold(settings.sensor_threshold.toString());
      setEmailNotifications(settings.email_notifications);
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Update user in Supabase
      const userId = parseInt(currentUser.id);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          username: name,
          email
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local user state
      const updatedUser = { ...currentUser, name, email };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
    
    setIsLoading(true);

    try {
      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const threshold = parseFloat(sensorThreshold);
      if (isNaN(threshold) || threshold < 0.1 || threshold > 5) {
        toast.error('Sensor threshold must be between 0.1 and 5 amperes');
        return;
      }

      const success = await updateSystemSettings({
        sensor_threshold: threshold,
        email_notifications: emailNotifications
      });

      if (success) {
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
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
                      <div className="flex space-x-3">
                        <Button 
                          type="submit" 
                          className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Updating...' : 'Update Profile'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={handleLogout}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Signing out...' : 'Sign Out'}
                        </Button>
                      </div>
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
                        disabled={isLoading}
                      >
                        {isLoading ? 'Updating...' : 'Update Password'}
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
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Preferences'}
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
                          disabled={isLoading}
                        >
                          {isLoading ? 'Saving...' : 'Save System Settings'}
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
