
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Calendar, Clock, User, Settings, ArrowRight, List } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { timeSlots, getUserBookings } = useBooking();
  const navigate = useNavigate();
  
  const userBookings = getUserBookings();
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  if (!currentUser) {
    return <div>Loading...</div>;
  }
  
  // Calculate stats
  const upcomingBookings = userBookings.length;
  
  // Get next booking
  const nextBooking = userBookings
    .filter(booking => booking.paymentStatus === 'completed')
    .sort((a, b) => {
      const dateA = new Date(`${a.slot.date}T${a.slot.startTime}`);
      const dateB = new Date(`${b.slot.date}T${b.slot.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })[0];
  
  // Count available slots
  const availableSlots = timeSlots.filter(slot => !slot.isBooked).length;
  
  return (
    <div className="booking-container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-booking-primary">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser.name || currentUser.email.split('@')[0]}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/booking">
            <Button className="bg-booking-primary hover:bg-opacity-90">
              Book New Appointment
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">My Bookings</CardTitle>
            <CardDescription>Your upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-booking-primary mr-4" />
              <div>
                <p className="text-3xl font-bold">{upcomingBookings}</p>
                <p className="text-sm text-gray-500">Total bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Slots</CardTitle>
            <CardDescription>Time slots you can book</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-booking-primary mr-4" />
              <div>
                <p className="text-3xl font-bold">{availableSlots}</p>
                <p className="text-sm text-gray-500">Open slots</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {currentUser.isAdmin ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Admin Panel</CardTitle>
              <CardDescription>Manage appointments and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-booking-primary mr-4" />
                <div className="flex-grow">
                  <p className="text-sm text-gray-500 mb-2">Access admin tools</p>
                  <Link to="/admin">
                    <Button size="sm" className="bg-booking-primary hover:bg-opacity-90">
                      Open Admin Panel
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Account</CardTitle>
              <CardDescription>Your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <User className="h-8 w-8 text-booking-primary mr-4" />
                <div>
                  <p className="font-medium">{currentUser.name || currentUser.email.split('@')[0]}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Next Appointment</CardTitle>
            <CardDescription>Your upcoming scheduled booking</CardDescription>
          </CardHeader>
          <CardContent>
            {nextBooking ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-booking-accent p-2 rounded-full mr-3">
                    <Calendar className="h-5 w-5 text-booking-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {format(new Date(nextBooking.slot.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-booking-accent p-2 rounded-full mr-3">
                    <Clock className="h-5 w-5 text-booking-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{nextBooking.slot.startTime} - {nextBooking.slot.endTime}</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Link to={`/my-bookings`}>
                    <Button variant="link" className="p-0 h-auto text-booking-primary flex items-center">
                      <span>View appointment details</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">You don't have any upcoming appointments</p>
                <Link to="/booking">
                  <Button className="bg-booking-primary hover:bg-opacity-90">
                    Book Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Your latest appointments</CardDescription>
            </div>
            <Link to="/my-bookings">
              <Button variant="ghost" className="text-sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {userBookings.length > 0 ? (
              <div className="space-y-4">
                {userBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center p-3 rounded-md border hover:bg-gray-50 transition-colors">
                    <div className="bg-booking-accent p-2 rounded-full mr-3">
                      <Calendar className="h-4 w-4 text-booking-primary" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">
                        {format(new Date(booking.slot.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.slot.startTime} - {booking.slot.endTime}
                      </p>
                    </div>
                    <div className={`text-xs py-1 px-2 rounded-full ${
                      booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.paymentStatus === 'completed' ? 'Confirmed' : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <List className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No booking history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
