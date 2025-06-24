
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu, X, User, Calendar, ClipboardList, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavBar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Book Now', path: '/booking' },
  ];

  const authenticatedItems = currentUser ? [
    { name: 'Dashboard', path: '/dashboard', icon: ClipboardList },
    { name: 'My Bookings', path: '/my-bookings', icon: Calendar },
    currentUser.isAdmin ? { name: 'Admin', path: '/admin', icon: Settings } : null,
  ].filter(Boolean) : [];

  const closeSheet = () => setIsOpen(false);

  const NavLink = ({ path, children, className }: { path: string; children: React.ReactNode; className?: string }) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        className={cn(
          "text-gray-700 hover:text-booking-primary transition-colors",
          isActive && "text-booking-primary font-medium",
          className
        )}
        onClick={closeSheet}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="booking-container py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-booking-primary" />
            <span className="font-bold text-xl text-booking-primary">BookingWithAbs</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map(item => (
              <NavLink key={item.path} path={item.path}>
                {item.name}
              </NavLink>
            ))}
            
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{currentUser.name || currentUser.email.split('@')[0]}</span>
                  </Button>
                  <div className="absolute right-0 w-48 mt-1 bg-white shadow-lg rounded-md overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top-right">
                    {authenticatedItems.map(item => item && (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline" className="border-booking-primary text-booking-primary hover:bg-booking-accent">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-booking-primary hover:bg-opacity-90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col h-full">
                <div className="py-4">
                  <h2 className="text-xl font-bold text-booking-primary">BookMaster</h2>
                </div>
                <nav className="flex flex-col space-y-3 py-4">
                  {navigationItems.map(item => (
                    <NavLink key={item.path} path={item.path} className="py-2">
                      {item.name}
                    </NavLink>
                  ))}
                  {currentUser && authenticatedItems.map(item => item && (
                    <NavLink key={item.path} path={item.path} className="py-2 flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </nav>
                <div className="mt-auto py-4 border-t">
                  {currentUser ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4" />
                        <span>{currentUser.name || currentUser.email}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full border-red-500 text-red-500" 
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link to="/login" onClick={closeSheet}>
                        <Button variant="outline" className="w-full">
                          Log In
                        </Button>
                      </Link>
                      <Link to="/register" onClick={closeSheet}>
                        <Button className="w-full bg-booking-primary">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
