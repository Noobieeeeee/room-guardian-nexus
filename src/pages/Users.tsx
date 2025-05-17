
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import AppSidebar from '@/components/AppSidebar';
import { User } from '@/lib/types';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { toast } from 'sonner';
import { getUsers } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from 'lucide-react';
import UserFormModal from '@/components/UserFormModal';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        // Only admin can access this page
        if (user.role !== 'admin') {
          toast.error('You do not have permission to access this page');
          navigate('/dashboard');
          return;
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        navigate('/');
        return;
      }
    } else {
      // No user found, redirect to login
      navigate('/');
      return;
    }
    
    // Fetch users data
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersData = await getUsers();
        if (usersData && Array.isArray(usersData)) {
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    // This would connect to an actual delete API
    try {
      // Mock deletion for now
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleSaveUser = async (userData: User) => {
    try {
      if (selectedUser) {
        // Update existing user (mock for now)
        setUsers(users.map(user => (user.id === userData.id ? userData : user)));
        toast.success('User updated successfully');
      } else {
        // Add new user (mock for now)
        const newUser = {
          ...userData,
          id: `tmp-${Date.now()}`, // Would be replaced by an actual ID from the backend
        };
        setUsers([...users, newUser]);
        toast.success('User added successfully');
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'faculty':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'guest':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guardian-yellow"></div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={currentUser?.role || 'guest'} />
        <SidebarInset className="flex-1 w-full">
          <Navigation userRole={currentUser?.role || 'guest'} />
          
          <main className="w-full px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage system users and their permissions</p>
              </div>
              
              <Button onClick={handleAddUser} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableCaption>List of all system users.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id} // Prevent deleting yourself
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </main>
          
          <UserFormModal 
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveUser}
            user={selectedUser}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Users;
