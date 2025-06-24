import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/types';
import { config } from '@/lib/config';

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
      // Validate JWT token with backend
      const validateToken = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.log('🔍 Frontend: No token found in localStorage');
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        console.log('🔍 Frontend: Validating JWT token with backend...');
        console.log('   API URL:', `${config.apiUrl}/api/user/validate-token`);
        console.log('   Token exists:', !!token);
        
        const response = await fetch(`${config.apiUrl}/api/user/validate-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('🔍 Frontend: Token validation response:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Frontend: Token valid, user data:', data);
          const user: User = {
            id: data.userId,
            email: data.email,
            isAdmin: data.isAdmin,
            name: data.name,
          };
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          // Token is invalid, clear localStorage
          console.log('❌ Frontend: Token invalid, clearing user data');
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('❌ Frontend: Token validation error:', error);
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleSessionExpired = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
  }, [toast]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      console.log('🔑 Frontend: Attempting login...');
      console.log('   API URL:', `${config.apiUrl}/api/user/login`);
      
      const response = await fetch(`${config.apiUrl}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      console.log('🔑 Frontend: Login response status:', response.status);
      console.log('🔑 Frontend: Login response data:', data);

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

      // Store JWT token
      localStorage.setItem('authToken', data.token);

      const user: User = {
        id: data.userId,
        email: data.email,
        isAdmin: data.isAdmin,
        name: data.name,
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      console.log('✅ Frontend: Login successful, user set:', user);
      console.log('🔑 Frontend: JWT token stored in localStorage');
      
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
      return true;
    } catch (error) {
      console.error('❌ Frontend: Login error:', error);
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
      
      const response = await fetch(`${config.apiUrl}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
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
      // Clear frontend state immediately since JWT is stateless
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      
      // Optional: Call backend for logging/audit purposes
      await fetch(`${config.apiUrl}/api/user/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if backend call fails, still clear local state
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      
      toast({
        title: "Logged out",
        description: "You have been logged out",
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
