
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { signIn } from '@/lib/auth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await signIn(email, password);
      
      if (user) {
        // Store user in localStorage for persistence
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate('/dashboard');
        toast.success(`Welcome, ${user.name}!`);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
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
          <p>Default accounts:</p>
          <p className="mt-1">admin@example.com / password</p> 
          <p className="mt-1">faculty@example.com / password</p>
          <p className="mt-1">guest@example.com / password</p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
