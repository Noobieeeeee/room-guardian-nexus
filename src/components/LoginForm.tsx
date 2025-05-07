
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { mockUsers } from '@/lib/mockData';
import { toast } from 'sonner';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In a real app, we'd validate credentials against an API
    // For now, we'll simulate authentication with our mock users
    setTimeout(() => {
      const user = mockUsers.find(user => user.email === email);
      
      if (user && password === 'password') {
        // Login successful
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate('/dashboard');
        toast.success(`Welcome, ${user.name}!`);
      } else {
        // Login failed
        toast.error('Invalid email or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md guardian-card-shadow">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">Login to RoomGuardian</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-guardian-yellow hover:bg-guardian-yellow/80 text-guardian-purple"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-sm text-muted-foreground text-center w-full">
          <p>Demo accounts:</p>
          <p>Admin: john.doe@example.com</p>
          <p>Faculty: jane.smith@example.com</p>
          <p>Guest: guest@example.com</p>
          <p className="mt-2">(Use "password" for all accounts)</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
