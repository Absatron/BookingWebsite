import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useNavigate, Link } from 'react-router-dom'; // Import useNavigate
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Calendar, Clock, User, Settings, ArrowRight, List, Loader2 } from 'lucide-react'; // Import Loader2
import { format, parseISO } from 'date-fns'; // Import parseISO
import { Booking } from '@/types'; // Import Booking type

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { timeSlots, getUserBookings } = useBooking();
  const navigate = useNavigate();
  const [userBookings, setUserBookings] = useState<Booking[]>([]); // State for bookings
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch bookings on mount and when user changes
  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) {
        setIsLoading(false);
        setUserBookings([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const bookingsData = await getUserBookings();
        setUserBookings(bookingsData);
      } catch (err) {
        console.error("Failed to fetch user bookings for dashboard:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setUserBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [currentUser, getUserBookings]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser && !isLoading) { // Check isLoading to prevent redirect during initial load
      navigate('/login');
    }
  }, [currentUser, isLoading, navigate]);

  // Show loading state while fetching user or bookings
  if (isLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="booking-container py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
             <Calendar className="h-12 w-12 text-red-300 mb-4" />
             <h3 className="text-xl font-medium text-red-700 mb-2">Error Loading Dashboard Data</h3>
             <p className="text-red-600 text-center max-w-md">
               Could not load your booking information. Please try again later. <br/>
               <span className="text-sm">({error})</span>
             </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats using the state variable
  const upcomingBookingsCount = userBookings.length;

  // Get next booking using the state variable
  const nextBooking = userBookings
    .filter(booking => booking.paymentStatus === 'completed')
    .sort((a, b) => {
      // Use parseISO since date is now a string 'yyyy-MM-dd'
      const dateA = new Date(`${parseISO(a.slot.date).toISOString().split('T')[0]}T${a.slot.startTime}`);
      const dateB = new Date(`${parseISO(b.slot.date).toISOString().split('T')[0]}T${b.slot.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })[0];

  // Count available slots (this logic remains the same)
  const availableSlots = timeSlots.filter(slot => !slot.isBooked).length;

  return (
    <div className="booking-container py-8">
      {/* ... Header section remains the same ... */}
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

      {/* ... Stats cards section - use upcomingBookingsCount ... */}
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
                <p className="text-3xl font-bold">{upcomingBookingsCount}</p> {/* Use count from state */}
                <p className="text-sm text-gray-500">Total bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ... Available Slots card remains the same ... */}
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

        {/* ... Admin/Account card remains the same ... */}
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

      {/* ... Next Appointment and Recent Bookings section - use state variables ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Next Appointment</CardTitle>
            <CardDescription>Your upcoming scheduled booking</CardDescription>
          </CardHeader>
          <CardContent>
            {nextBooking ? (
              <div className="space-y-4">
                {/* ... Next booking details - use parseISO for date ... */}
                 <div className="flex items-center">
                  <div className="bg-booking-accent p-2 rounded-full mr-3">
                    <Calendar className="h-5 w-5 text-booking-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {/* Use parseISO here */}
                      {format(parseISO(nextBooking.slot.date), 'EEEE, MMMM d, yyyy')}
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
              // ... No upcoming appointments content remains the same ...
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
            {/* Use userBookings state variable */}
            {userBookings.length > 0 ? (
              <div className="space-y-4">
                {/* Use parseISO for date */}
                {userBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center p-3 rounded-md border hover:bg-gray-50 transition-colors">
                    <div className="bg-booking-accent p-2 rounded-full mr-3">
                      <Calendar className="h-4 w-4 text-booking-primary" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">
                        {/* Use parseISO here */}
                        {format(parseISO(booking.slot.date), 'MMM d, yyyy')}
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
              // ... No booking history content remains the same ...
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