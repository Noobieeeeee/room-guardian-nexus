
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { setupDatabase } from '../scripts/setupDatabase';
import { toast } from 'sonner';

interface DatabaseSetupProps {
  onSetupComplete: () => void;
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onSetupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSetup = async () => {
    try {
      setIsLoading(true);
      setSetupStatus('loading');
      
      await setupDatabase();
      
      setSetupStatus('success');
      toast.success('Database setup completed successfully!');
      
      // Delay the completion to allow user to see the success message
      setTimeout(() => {
        onSetupComplete();
      }, 2000);
    } catch (error) {
      console.error('Setup error:', error);
      setSetupStatus('error');
      toast.error('Failed to set up database');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Database Setup</CardTitle>
        <CardDescription>
          Set up your RoomGuardian database with initial data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This will create sample rooms and user accounts in your Supabase database
          to get you started with RoomGuardian.
        </p>
        
        {setupStatus === 'success' && (
          <Alert variant="default" className="bg-green-50 mb-4">
            <AlertTitle>Setup Complete!</AlertTitle>
            <AlertDescription>
              <p>Database has been successfully set up with sample data.</p>
              <p className="mt-2">You can now log in with:</p>
              <ul className="list-disc list-inside mt-1">
                <li>admin@example.com / password (Admin role)</li>
                <li>faculty@example.com / password (Faculty role)</li>
                <li>guest@example.com / password (Guest role)</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {setupStatus === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Setup Failed</AlertTitle>
            <AlertDescription>
              There was an error setting up the database. Please check the console for more information.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSetup} 
          disabled={isLoading || setupStatus === 'success'}
          className="bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
        >
          {isLoading ? 'Setting up...' : 'Set Up Database'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseSetup;
