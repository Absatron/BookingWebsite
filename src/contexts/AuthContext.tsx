import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/types';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  handleSessionExpired: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
      // maintain consistency with backend session
      const validateSession = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/user/validate-session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const user: User = {
            id: data.userId,
            email: data.email,
            isAdmin: data.isAdmin,
            name: data.name,
          };
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          // Session is invalid, clear localStorage
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const handleSessionExpired = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
  }, [toast]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important for handling cookies/session
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an email not verified error
        if (data.emailNotVerified) {
          toast({
            title: "Email not verified",
            description: data.message,
            variant: "destructive",
          });
          // Store email for resend verification
          localStorage.setItem('unverifiedEmail', data.email);
          // Redirect to resend verification page
          window.location.href = '/resend-verification';
          return false;
        }
        
        toast({
          title: "Login failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }

      const user: User = {
        id: data.userId,
        email: data.email,
        isAdmin: data.isAdmin,
        name: data.name,
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      toast({
        title: "Login successful",
        description: `Welcome back!`,
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
      
      const response = await fetch('http://localhost:3000/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include', // Important for handling cookies/session
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Registration failed",
          description: data.message || "Registration failed",
          variant: "destructive",
        });
        return false;
      }

      // Registration successful - show message about email verification
      toast({
        title: "Registration successful!",
        description: data.message || "Please check your email to verify your account.",
      });
      
      // Don't set user as logged in since they need to verify email first
      return true;
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${name}!`,
      });
      return true;
    } catch (error) {
      console.error("Registration error:", error);
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

  const logout = async () => {
    try {
      // Call backend to destroy session
      const response = await fetch('http://localhost:3000/api/user/logout', {
        method: 'POST',
        credentials: 'include', // Important: includes cookies in the request
      });

      if (!response.ok) {
        throw new Error(`Logout failed with status ${response.status}`);
      }
      
      // Clear frontend state
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    handleSessionExpired,
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
