
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/types';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration purposes
const mockUsers: User[] = [
  { id: '1', email: 'admin@example.com', name: 'Admin User', isAdmin: true },
  { id: '2', email: 'user@example.com', name: 'Regular User', isAdmin: false },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication
      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }
      
      // In real app, you'd validate the password here
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || 'user'}!`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email already exists
      if (mockUsers.some(u => u.email === email)) {
        toast({
          title: "Registration failed",
          description: "Email already in use",
          variant: "destructive",
        });
        return false;
      }
      
      // In a real app, you'd create a user in the database
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        isAdmin: false,
      };
      
      // Add to mock users (would be a database operation)
      mockUsers.push(newUser);
      
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      toast({
        title: "Registration successful",
        description: `Welcome, ${name}!`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
