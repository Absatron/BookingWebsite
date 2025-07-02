import React, { useState, useEffect } from 'react'; 
import { useNavigate, Link } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Calendar, Clock, User, Settings, ArrowRight, List, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns'; 
import { Booking, TimeSlot } from '@/types'; 

const Dashboard = () => {
  const { currentUser, loading } = useAuth();
  const { timeSlots, getUserBookings, getAllAdminBookings } = useBooking();
  const navigate = useNavigate();
  const [userBookings, setUserBookings] = useState<Booking[]>([]); // State for bookings
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch bookings on mount and when user or bookings change
  useEffect(() => {
    const fetchBookings = async () => {

      if (loading) return;

      if (!currentUser) {
        setUserBookings([]);
        setIsLoading(false);
        navigate('/login');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Use different fetch logic for admin users
        const bookingsData = currentUser.isAdmin 
          ? await getAllAdminBookings() 
          : await getUserBookings();
        setUserBookings(bookingsData);
      } catch (err) {
        console.error("Failed to fetch user bookings for dashboard:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setUserBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    console.log("Fetching bookings for user:", currentUser?.email);
    fetchBookings();
  }, [currentUser, loading, getUserBookings, getAllAdminBookings, navigate]);  

  // Show loading state while fetching user or bookings
  if (loading || (isLoading && currentUser) ){
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-booking-primary" />
        <span className="ml-2 text-gray-600">Redirecting to login...</span>
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

  // Helper function to check if a booking is in the future
  const isFutureBooking = (booking: Booking) => {
    const bookingDate = parseISO(booking.slot.date);
    const [hours, minutes] = booking.slot.startTime.split(':').map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    return bookingDateTime > new Date();
  };
    // Helper function to check if a time slot is in the future
  const isFutureSlot = (slot: TimeSlot) => {
    const slotDate = parseISO(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    return slotDateTime > new Date();
  };

  // Filter user bookings to only include future bookings
  const futureBookings = userBookings.filter(isFutureBooking); 

  // Calculate stats using filtered bookings
  const upcomingBookingsCount = futureBookings.length;

  // Get next booking using filtered bookings
  const nextBooking = futureBookings
    .filter(booking => booking.paymentStatus === 'completed')
    .sort((a, b) => {
      // Use parseISO since date is now a string 'yyyy-MM-dd'
      const dateA = new Date(`${parseISO(a.slot.date).toISOString().split('T')[0]}T${a.slot.startTime}`);
      const dateB = new Date(`${parseISO(b.slot.date).toISOString().split('T')[0]}T${b.slot.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })[0];

  // Count available slots 
  const availableSlots = timeSlots.filter(slot => !slot.isBooked && isFutureSlot(slot)).length;

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

      {/* ... Stats cards section - use upcomingBookingsCount ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {currentUser.isAdmin ? 'All Bookings' : 'My Bookings'}
            </CardTitle>
            <CardDescription>
              {currentUser.isAdmin ? 'Total confirmed appointments' : 'Your upcoming appointments'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-booking-primary mr-4" />
              <div>
                <p className="text-3xl font-bold">{upcomingBookingsCount}</p> {/* Use count from future bookings */}
                <p className="text-sm text-gray-500">
                  {currentUser.isAdmin ? 'Confirmed bookings' : 'Upcoming bookings'}
                </p>
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

      {/* ... Next Appointment and Recent Bookings section - use state variables ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {currentUser.isAdmin ? 'Next Appointment' : 'Next Appointment'}
            </CardTitle>
            <CardDescription>
              {currentUser.isAdmin ? 'Next confirmed appointment in the system' : 'Your upcoming scheduled booking'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextBooking ? (
              <div className="space-y-4">
                {/* ...existing booking details... */}
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

                {/* Show customer details for admin */}
                {currentUser.isAdmin && nextBooking.customerName && (
                  <div className="flex items-center">
                    <div className="bg-booking-accent p-2 rounded-full mr-3">
                      <User className="h-5 w-5 text-booking-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{nextBooking.customerName}</p>
                      <p className="text-xs text-gray-400">{nextBooking.customerEmail}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Link to={currentUser.isAdmin ? `/admin/booking/${nextBooking.id}` : `/booking/${nextBooking.id}`}>
                    <Button variant="link" className="p-0 h-auto text-booking-primary flex items-center">
                      <span>View appointment details</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              // ...existing no appointments content...
               <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  {currentUser.isAdmin ? 'No upcoming appointments in the system' : "You don't have any upcoming appointments"}
                </p>
                {!currentUser.isAdmin && (
                  <Link to="/booking">
                    <Button className="bg-booking-primary hover:bg-opacity-90">
                      Book Now
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {currentUser.isAdmin ? 'Recent Bookings' : 'Recent Bookings'}
              </CardTitle>
              <CardDescription>
                {currentUser.isAdmin ? 'Latest appointments in the system' : 'Your latest appointments'}
              </CardDescription>
            </div>
            <Link to={currentUser.isAdmin ? "/admin/bookings" : "/my-bookings"}>
              <Button variant="ghost" className="text-sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {/* Use userBookings for recent bookings */}
            {userBookings.length > 0 ? (
              <div className="space-y-4">
                {/* Sort by appointment date/time in descending order (most recent appointments first) and take first 3 */}
                {userBookings
                  .sort((a, b) => {
                    const dateTimeA = new Date(`${parseISO(a.slot.date).toISOString().split('T')[0]}T${a.slot.startTime}`);
                    const dateTimeB = new Date(`${parseISO(b.slot.date).toISOString().split('T')[0]}T${b.slot.startTime}`);
                    return dateTimeB.getTime() - dateTimeA.getTime();
                  })
                  .slice(0, 3)
                  .map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center p-3 rounded-md border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(currentUser.isAdmin ? `/admin/booking/${booking.id}` : `/booking/${booking.id}`)}
                  >
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
                      {/* Show customer name for admin */}
                      {currentUser.isAdmin && booking.customerName && (
                        <p className="text-xs text-gray-400">
                          {booking.customerName}
                        </p>
                      )}
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
              // No booking history message
              <div className="text-center py-8">
                <List className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {currentUser.isAdmin ? 'No confirmed bookings in the system yet' : 'No booking history yet'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;